import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'provisioning_orders', timestamps: true, versionKey: false })
export class ProvisioningOrder {
  @Prop({ type: String, required: true })
  _id!: string; // el provisioningOrderId, por ejemplo "po-1a2b3c4d"

  @Prop({ required: true, unique: true })
  activationId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true })
  planId!: string;

  @Prop({ type: String, required: true, default: 'COMPLETED' })
  status!: 'COMPLETED' | 'FAILED';
}

export const ProvisioningOrderSchema = SchemaFactory.createForClass(ProvisioningOrder);