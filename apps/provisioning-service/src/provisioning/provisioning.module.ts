import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningOrder, ProvisioningOrderSchema } from './provisioning-order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProvisioningOrder.name, schema: ProvisioningOrderSchema }]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'provisioning-service-producer',
            brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9092'],
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
})
export class ProvisioningModule {}