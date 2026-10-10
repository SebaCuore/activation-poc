import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivationsController } from './activations.controller';
import { ActivationsService } from './activations.service';
import { Activation, ActivationSchema } from './activation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Activation.name, schema: ActivationSchema }]),
  ],
  controllers: [ActivationsController],
  providers: [ActivationsService],
})
export class ActivationsModule {}