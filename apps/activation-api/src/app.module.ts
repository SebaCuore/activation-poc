import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivationsModule } from './activations/activations.module';

@Module({
  imports: [ActivationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
