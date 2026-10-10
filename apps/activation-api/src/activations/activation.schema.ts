import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { SimulateFailure } from '@poc/contracts';
import type { ActivationStatus } from './activation';

@Schema({ collection: 'activations', timestamps: true, versionKey: false })
export class Activation {
  @Prop({ type: String, required: true })
  _id!: string; // el activationId, por ejemplo "act-1a2b3c4d"

  @Prop({ required: true, index: true })
  customerId!: string;

  @Prop({ required: true })
  planId!: string;

  @Prop({ type: String, required: true, default: 'none' })
  simulateFailure!: SimulateFailure;

  @Prop({ type: String, required: true, default: 'PENDING' })
  status!: ActivationStatus;
}

export const ActivationSchema = SchemaFactory.createForClass(Activation);