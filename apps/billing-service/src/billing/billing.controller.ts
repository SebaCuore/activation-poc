import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { TOPICS } from '@poc/contracts';
import type { ActivationRequested } from '@poc/contracts';

@Controller()
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  @EventPattern<string>(TOPICS.ACTIVATION_REQUESTED)
  handleActivationRequested(
    @Payload() event: ActivationRequested,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(
      `Recibido ${event.eventType} | activación ${event.correlationId} | ` +
        `cliente ${event.customerId} | partición ${context.getPartition()} | ` +
        `offset ${context.getMessage().offset}`,
    );
  }
}