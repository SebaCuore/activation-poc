import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingAccount, BillingAccountSchema } from './billing-account.schema';
import { FailedActivation, FailedActivationSchema } from './failed-activation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BillingAccount.name, schema: BillingAccountSchema },
      { name: FailedActivation.name, schema: FailedActivationSchema }
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'billing-service-producer',
            brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}