import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Activaciones que ya fallaron: si la cuenta se crea después, se anula al toque
@Schema({ collection: 'failed_activations', timestamps: true, versionKey: false })
export class FailedActivation {
  @Prop({ type: String, required: true })
  _id!: string; // el activationId

  @Prop({ required: true })
  reason!: string;
}

export const FailedActivationSchema = SchemaFactory.createForClass(FailedActivation);