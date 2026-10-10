import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { createEvent, TOPICS } from '@poc/contracts';
import type { ActivationRequested, BillingAccountCreated } from '@poc/contracts';
import { BillingAccount } from './billing-account.schema';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(BillingAccount.name) private readonly accountModel: Model<BillingAccount>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async createAccount(request: ActivationRequested) {
    // 1. Crear la cuenta de facturación simulada en la base de billing
    const account = await this.accountModel.create({
      _id: `ba-${randomUUID().slice(0, 8)}`,
      activationId: request.correlationId,
      customerId: request.customerId,
      planId: request.payload.planId,
      status: 'CREATED',
    });

    // 2. Armar el evento de resultado
    const event = createEvent<BillingAccountCreated>(
      'BillingAccountCreated',
      {
        correlationId: request.correlationId,
        customerId: request.customerId,
        source: 'billing-service',
      },
      { billingAccountId: account._id },
    );

    // 3. Publicarlo en billing.events (clave = customerId)
    await lastValueFrom(
      this.kafka.emit(TOPICS.BILLING_EVENTS, { key: event.customerId, value: event }),
    );
    this.logger.log(
      `Cuenta ${account._id} creada | publicado ${event.eventType} para ${event.correlationId}`,
    );
  }
}