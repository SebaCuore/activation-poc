import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { createEvent, TOPICS } from '@poc/contracts';
import type { ActivationRequested, ProvisioningCompleted } from '@poc/contracts';
import { ProvisioningOrder } from './provisioning-order.schema';

@Injectable()
export class ProvisioningService implements OnModuleInit {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @InjectModel(ProvisioningOrder.name) private readonly orderModel: Model<ProvisioningOrder>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async provision(request: ActivationRequested) {
    // 1. Simular que aprovisionar lleva tiempo: entre 1 y 3 segundos
    const delayMs = 1000 + Math.floor(Math.random() * 2000);
    this.logger.log(`Aprovisionando ${request.correlationId}... (${delayMs} ms)`);
    await sleep(delayMs);

    // 2. Guardar la orden de aprovisionamiento en la base de provisioning
    const order = await this.orderModel.create({
      _id: `po-${randomUUID().slice(0, 8)}`,
      activationId: request.correlationId,
      customerId: request.customerId,
      planId: request.payload.planId,
      status: 'COMPLETED',
    });

    // 3. Publicar el resultado en provisioning.events (clave = customerId)
    const event = createEvent<ProvisioningCompleted>(
      'ProvisioningCompleted',
      {
        correlationId: request.correlationId,
        customerId: request.customerId,
        source: 'provisioning-service',
      },
      { provisioningOrderId: order._id },
    );

    await lastValueFrom(
      this.kafka.emit(TOPICS.PROVISIONING_EVENTS, { key: event.customerId, value: event }),
    );
    this.logger.log(
      `Orden ${order._id} completada | publicado ${event.eventType} para ${event.correlationId}`,
    );
  }
}