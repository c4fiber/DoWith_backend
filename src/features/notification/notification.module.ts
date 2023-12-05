import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from 'src/entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayModule } from 'src/gateway/gateway.module';
import { DoWithExceptions } from 'src/utils/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), GatewayModule],
  controllers: [NotificationController],
  providers: [NotificationService, DoWithExceptions],
  exports: [NotificationService],
})
export class NotificationModule {}