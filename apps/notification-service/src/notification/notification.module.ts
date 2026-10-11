import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRecord, NotificationRecordSchema } from './notification-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationRecord.name, schema: NotificationRecordSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}