import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientKafka } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { createEvent, TOPICS } from '@poc/contracts';
import type {
  ActivationFailed,
  ActivationRequested,
  AnyEvent,
  BillingAccountCancelled,
  BillingAccountCreated,
  BillingFailed,
} from '@poc/contracts';
import { BillingAccount } from './billing-account.schema';
import { FailedActivation } from './failed-activation.schema';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(BillingAccount.name) private readonly accountModel: Model<BillingAccount>,
    @InjectModel(FailedActivation.name) private readonly failedModel: Model<FailedActivation>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async createAccount(request: ActivationRequested) {
    const meta = {
      correlationId: request.correlationId,
      customerId: request.customerId,
      source: 'billing-service',
    };

    // Fallo forzado desde la demo: no se crea la cuenta y se avisa
    if (request.payload.simulateFailure === 'billing') {
      const failed = createEvent<BillingFailed>('BillingFailed', meta, {
        reason: 'Fallo simulado en billing',
      });
      await this.publish(failed);
      return;
    }

    const account = await this.accountModel.create({
      _id: `ba-${randomUUID().slice(0, 8)}`,
      activationId: request.correlationId,
      customerId: request.customerId,
      planId: request.payload.planId,
      status: 'CREATED',
    });

    const created = createEvent<BillingAccountCreated>('BillingAccountCreated', meta, {
      billingAccountId: account._id,
    });
    await this.publish(created);

    // Caso borde: si la activación ya había fallado, anular enseguida
    if (await this.failedModel.exists({ _id: request.correlationId })) {
      await this.cancelAccount(request.correlationId);
    }
  }

  // Compensación: llega ActivationFailed
  async compensate(event: ActivationFailed) {
    // Anotar que esta activación falló (por si la cuenta se crea después)
    await this.failedModel.updateOne(
      { _id: event.correlationId },
      { $set: { reason: event.payload.reason } },
      { upsert: true },
    );
    await this.cancelAccount(event.correlationId);
  }

  private async cancelAccount(activationId: string) {
    // Solo anula si existe y todavía está CREATED (así se anula una sola vez)
    const account = await this.accountModel
      .findOneAndUpdate(
        { activationId, status: 'CREATED' },
        { $set: { status: 'CANCELLED' } },
        { returnDocument: 'after' },
      )
      .lean();
    if (!account) return;

    const cancelled = createEvent<BillingAccountCancelled>(
      'BillingAccountCancelled',
      { correlationId: activationId, customerId: account.customerId, source: 'billing-service' },
      { billingAccountId: account._id },
    );
    await this.publish(cancelled);
  }

  private async publish(event: AnyEvent) {
    await lastValueFrom(
      this.kafka.emit(TOPICS.BILLING_EVENTS, { key: event.customerId, value: event }),
    );
    this.logger.log(`Publicado ${event.eventType} para ${event.correlationId}`);
  }
}