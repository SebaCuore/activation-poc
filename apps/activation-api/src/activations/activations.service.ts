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
import { ActivationRequested, createEvent, TOPICS } from '@poc/contracts';
import type { CreateActivationDto } from './activation';
import { Activation } from './activation.schema';

@Injectable()
export class ActivationsService implements OnModuleInit {
  private readonly logger = new Logger(ActivationsService.name);

  constructor(
    @InjectModel(Activation.name) private readonly activationModel: Model<Activation>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
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
    await lastValueFrom(
      this.kafka.emit(TOPICS.ACTIVATION_REQUESTED, {
        key: event.customerId,
        value: event,
      }),
    );
    this.logger.log(`Publicado ${event.eventType} para ${event.correlationId}`);

    return { activationId: activation._id, status: activation.status };
  }

  async findOne(id: string) {
    const activation = await this.activationModel.findById(id).lean();
    if (!activation) {
      throw new NotFoundException(`No existe la activación ${id}`);
    }
    return activation;
  }
}