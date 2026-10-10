import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type BillingAccountStatus = 'CREATED' | 'CANCELLED';

@Schema({ collection: 'billing_accounts', timestamps: true, versionKey: false })
export class BillingAccount {
  @Prop({ type: String, required: true })
  _id!: string; // el billingAccountId, por ejemplo "ba-1a2b3c4d"

  @Prop({ required: true, unique: true })
  activationId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true })
  planId!: string;

  @Prop({ type: String, required: true, default: 'CREATED' })
  status!: BillingAccountStatus;
}

export const BillingAccountSchema = SchemaFactory.createForClass(BillingAccount);