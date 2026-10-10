import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvisioningModule } from './provisioning/provisioning.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/provisioning?directConnection=true',
    ),
    ProvisioningModule,
  ],
})
export class AppModule {}