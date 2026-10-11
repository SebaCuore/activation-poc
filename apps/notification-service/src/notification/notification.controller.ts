import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TOPICS } from '@poc/contracts';
import type { ActivationOutcomeEvent } from '@poc/contracts';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern<string>(TOPICS.ACTIVATION_EVENTS)
  async handleActivationOutcome(@Payload() event: ActivationOutcomeEvent) {
    await this.notificationService.notify(event);
  }
}