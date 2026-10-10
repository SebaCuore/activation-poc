import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ActivationsController } from './activations.controller';
import { ActivationsService } from './activations.service';
import { Activation, ActivationSchema } from './activation.schema';
import { ActivationEventsController } from './activation-events.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Activation.name, schema: ActivationSchema }]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'activation-api',
            brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [ActivationsController, ActivationEventsController],
  providers: [ActivationsService],
})
export class ActivationsModule {}