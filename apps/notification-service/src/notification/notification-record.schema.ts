import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'notifications', timestamps: true, versionKey: false })
export class NotificationRecord {
  @Prop({ required: true })
  activationId!: string;

  @Prop({ required: true })
  eventType!: string;

  @Prop({ required: true })
  to!: string;

  @Prop({ required: true })
  subject!: string;
}

export const NotificationRecordSchema = SchemaFactory.createForClass(NotificationRecord);
// Un email por activación y tipo de evento (índice de la sección 07 del PDF)
NotificationRecordSchema.index({ activationId: 1, eventType: 1 }, { unique: true });
