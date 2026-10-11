import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@poc/contracts';
import type { BillingEvent, ProvisioningEvent } from '@poc/contracts';
import { ActivationsService } from './activations.service';

@Controller()
export class ActivationEventsController {
  constructor(private readonly activationsService: ActivationsService) {}

  @EventPattern<string>(TOPICS.BILLING_EVENTS)
  async handleBillingEvent(@Payload() event: BillingEvent) {
    switch (event.eventType) {
      case 'BillingAccountCreated':
        return this.activationsService.registerStepResult('billing', true, event);
      case 'BillingFailed':
        return this.activationsService.registerStepResult('billing', false, event);
      case 'BillingAccountCancelled':
        return this.activationsService.addToHistory(event);
    }
  }

  @EventPattern<string>(TOPICS.PROVISIONING_EVENTS)
  async handleProvisioningEvent(@Payload() event: ProvisioningEvent) {
    switch (event.eventType) {
      case 'ProvisioningCompleted':
        return this.activationsService.registerStepResult('provisioning', true, event);
      case 'ProvisioningFailed':
        return this.activationsService.registerStepResult('provisioning', false, event);
    }
  }
}