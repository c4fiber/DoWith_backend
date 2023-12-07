import {
    Get,
    Post,
    Patch,
    Put,
    Controller,
    Logger,
    Body,
    Param,
    ParseIntPipe,
  } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/createNotification.dto';
import { UpdateNotificationDto } from './dto/updateNotification.dto';
import { Notification } from 'src/entities/notification.entity';
import { AppGateway } from 'src/gateway/app.gateway';

@Controller('notification')
export class NotificationController {
    constructor(
        private notificationService: NotificationService,
        private appGateWay: AppGateway,
        ) {}

    @Get(':user_id')
    findAllByUser(
        @Param('user_id', ParseIntPipe) user_id: number,
    ): Promise<Notification[]> {
        return this.notificationService.findAllByUser(user_id);
    }

    // @Post()
    // create(
    //     @Body() createNotificationDto: CreateNotificationDto
    // ): Promise<Comment> {
    //     return this.notificationService.createNotification(createNotificationDto);
    // }

    @Put(':noti_id')
    async update(
        @Param('noti_id', ParseIntPipe) noti_id: number,
        @Body() updateNotificationDto: UpdateNotificationDto,
    ): Promise<Notification> {
        const newNoti = await this.notificationService.updateNotification(noti_id, updateNotificationDto);
        
        if (newNoti.req_type == '1') {
            this.appGateWay.notifyFriendResponse(newNoti);
        }
        return newNoti
    }
}