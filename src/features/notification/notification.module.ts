import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from 'src/entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/utils/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController],
  providers: [NotificationService, DoWithExceptions],
  exports: [NotificationService],
})
export class NotificationModule {}