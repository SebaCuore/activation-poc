import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { TOPICS } from '@poc/contracts';
import type { ActivationRequested } from '@poc/contracts';
import { ProvisioningService } from './provisioning.service';

@Controller()
export class ProvisioningController {
  private readonly logger = new Logger(ProvisioningController.name);

  constructor(private readonly provisioningService: ProvisioningService) {}

  @EventPattern<string>(TOPICS.ACTIVATION_REQUESTED)
  async handleActivationRequested(
    @Payload() event: ActivationRequested,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(
      `Recibido ${event.eventType} | activación ${event.correlationId} | ` +
        `cliente ${event.customerId} | partición ${context.getPartition()} | ` +
        `offset ${context.getMessage().offset}`,
    );
    await this.provisioningService.provision(event);
  }
}