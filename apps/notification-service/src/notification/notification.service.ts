import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createTransport } from 'nodemailer';
import type { ActivationOutcomeEvent } from '@poc/contracts';
import { NotificationRecord } from './notification-record.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  // Conexión SMTP a Mailhog (servidor de email falso)
  private readonly mailer = createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });

  constructor(
    @InjectModel(NotificationRecord.name)
    private readonly notificationModel: Model<NotificationRecord>,
  ) {}

  async notify(event: ActivationOutcomeEvent) {
    const to = `${event.customerId.toLowerCase()}@clientes.demo`;

    const email =
      event.eventType === 'ActivationCompleted'
        ? {
            subject: `¡Tu plan ${event.payload.planId} ya está activo!`,
            text:
              `Hola ${event.customerId}:\n\n` +
              `Tu plan ${event.payload.planId} quedó activado.\n` +
              `Número de trámite: ${event.correlationId}\n`,
          }
        : {
            subject: 'No pudimos activar tu plan',
            text:
              `Hola ${event.customerId}:\n\n` +
              `Hubo un problema al activar tu plan (${event.payload.reason}).\n` +
              `No se te va a cobrar nada. Número de trámite: ${event.correlationId}\n`,
          };

    // 1. Mandar el email
    await this.mailer.sendMail({ from: 'Activaciones <no-reply@poc.local>', to, ...email });

    // 2. Registrar que se mandó
    await this.notificationModel.create({
      activationId: event.correlationId,
      eventType: event.eventType,
      to,
      subject: email.subject,
    });

    this.logger.log(`Email "${email.subject}" enviado a ${to} (${event.correlationId})`);
  }
}