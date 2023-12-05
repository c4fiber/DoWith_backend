import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from 'src/entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/utils/do-with-exception/do-with-exception';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), GatewayModule],
  controllers: [NotificationController],
  providers: [NotificationService, DoWithExceptions],
  exports: [NotificationService],
})
export class NotificationModule {}