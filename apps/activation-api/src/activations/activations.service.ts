import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { createEvent, TOPICS } from '@poc/contracts';
import type {
  ActivationCompleted,
  ActivationFailed,
  ActivationRequested,
  AnyEvent,
} from '@poc/contracts';
import type { CreateActivationDto, Step } from './activation';
import { Activation } from './activation.schema';
import { ActivationsGateway } from './activations.gateway';

@Injectable()
export class ActivationsService implements OnModuleInit {
  private readonly logger = new Logger(ActivationsService.name);

  constructor(
    @InjectModel(Activation.name) private readonly activationModel: Model<Activation>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
    private readonly gateway: ActivationsGateway,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async create(dto: CreateActivationDto) {
    if (!dto.customerId || !dto.planId) {
      throw new BadRequestException('customerId y planId son obligatorios');
    }

    // 1. Guardar la activación en Mongo
    const activation = await this.activationModel.create({
      _id: `act-${randomUUID().slice(0, 8)}`,
      customerId: dto.customerId,
      planId: dto.planId,
      simulateFailure: dto.simulateFailure ?? 'none',
      status: 'PENDING',
      history: [{ eventType: 'ActivationRequested', at: new Date().toISOString() }],
    });

    // 2. Armar el evento con el contrato compartido
    const event = createEvent<ActivationRequested>(
      'ActivationRequested',
      {
        correlationId: activation._id,
        customerId: activation.customerId,
        source: 'activation-api',
      },
      {
        planId: activation.planId,
        channel: 'web',
        simulateFailure: activation.simulateFailure,
      },
    );

    // 3. Publicarlo en Kafka (clave = customerId)
    await this.publish(TOPICS.ACTIVATION_REQUESTED, event);
    await this.broadcast(activation._id);

    return { activationId: activation._id, status: activation.status };
  }

  async findOne(id: string) {
    const activation = await this.activationModel.findById(id).lean();
    if (!activation) {
      throw new NotFoundException(`No existe la activación ${id}`);
    }
    return activation;
  }

  /**
   * Regla de agregación (sección 06 del PDF):
   * - guarda el resultado de cada servicio
   * - con los dos OK  -> ACTIVE y publica ActivationCompleted
   * - con el primer fallo -> FAILED y publica ActivationFailed
   * - si ya terminó, solo registra el evento en el historial
   */
  async registerStepResult(step: Step, ok: boolean, event: AnyEvent) {
    const id = event.correlationId;
    const now = new Date().toISOString();

    // 1. Guardar el resultado del paso y anotar el evento en el historial
    const activation = await this.activationModel
      .findByIdAndUpdate(
        id,
        {
          $set: { [`steps.${step}`]: { status: ok ? 'OK' : 'FAILED', at: now } },
          $push: { history: { eventType: event.eventType, at: now } },
        },
        { returnDocument: 'after' },
      )
      .lean();

    if (!activation) {
      this.logger.warn(`Llegó ${event.eventType} para ${id}, pero esa activación no existe`);
      return;
    }

    // 2. Si ya estaba terminada, no hacemos nada más
    if (activation.status === 'ACTIVE' || activation.status === 'FAILED') {
      await this.broadcast(id);
      return;
    }

    // 3. Decidir el nuevo estado
    if (!ok) {
      await this.finish(activation._id, 'FAILED', step);
    } else if (activation.steps.billing?.status === 'OK' && activation.steps.provisioning?.status === 'OK') {
      await this.finish(activation._id, 'ACTIVE');
    } else {
      await this.activationModel.updateOne(
        { _id: id, status: 'PENDING' },
        { $set: { status: 'IN_PROGRESS' } },
      );
      this.logger.log(`${id} -> IN_PROGRESS (llegó ${event.eventType}, falta el otro resultado)`);
    }
    await this.broadcast(id);
  }

  // Eventos que no cambian el estado, pero tienen que verse en el historial
  async addToHistory(event: AnyEvent) {
    await this.activationModel.updateOne(
      { _id: event.correlationId },
      { $push: { history: { eventType: event.eventType, at: new Date().toISOString() } } },
    );
    this.logger.log(`${event.correlationId}: registrado ${event.eventType} en el historial`);
    await this.broadcast(event.correlationId);
  }

  // Mandar el estado actual de la activación a la UI por WebSocket
  private async broadcast(id: string) {
    const activation = await this.activationModel.findById(id).lean();
    if (activation) this.gateway.emitUpdate(activation);
  }

  private async finish(id: string, finalStatus: 'ACTIVE' | 'FAILED', failedStep?: Step) {
    const eventType = finalStatus === 'ACTIVE' ? 'ActivationCompleted' : 'ActivationFailed';

    // Solo cambia si todavía no estaba terminada: así se publica una única vez
    const activation = await this.activationModel
      .findOneAndUpdate(
        { _id: id, status: { $nin: ['ACTIVE', 'FAILED'] } },
        {
          $set: { status: finalStatus },
          $push: { history: { eventType, at: new Date().toISOString() } },
        },
        { returnDocument: 'after' },
      )
      .lean();

    if (!activation) return;

    const meta = {
      correlationId: activation._id,
      customerId: activation.customerId,
      source: 'activation-api',
    };

    if (finalStatus === 'ACTIVE') {
      const event = createEvent<ActivationCompleted>('ActivationCompleted', meta, {
        planId: activation.planId,
      });
      await this.publish(TOPICS.ACTIVATION_EVENTS, event);
    } else {
      const event = createEvent<ActivationFailed>('ActivationFailed', meta, {
        reason: `Falló ${failedStep}`,
        failedStep: failedStep ?? 'billing',
      });
      await this.publish(TOPICS.ACTIVATION_EVENTS, event);
    }
    this.logger.log(`${id} -> ${finalStatus}`);
  }

  private async publish(topic: string, event: AnyEvent) {
    await lastValueFrom(this.kafka.emit(topic, { key: event.customerId, value: event }));
    this.logger.log(`Publicado ${event.eventType} para ${event.correlationId}`);
  }
}