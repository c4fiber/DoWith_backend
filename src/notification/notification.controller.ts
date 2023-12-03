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

@Controller('notification')
export class NotificationController {
    constructor(private notificationService: NotificationService) {}
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

    // @Put(':user_id/:noti_id')
    // update(
    //     @Param('noti_id', ParseIntPipe) noti_id: number,
    //     @Body() updateNotificationDto: UpdateNotificationDto,
    // ): Promise<Comment> {
    //     return this.notificationService.updateComment(noti_id, updateNotificationDto);
    // }
}