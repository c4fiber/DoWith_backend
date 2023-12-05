import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/entities/notification.entity';
import { User } from 'src/entities/user.entities';
import { Todo } from 'src/entities/todo.entity';
import { CreateNotificationDto } from './dto/createNotification.dto';
import { UpdateNotificationDto } from './dto/updateNotification.dto';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        // @InjectRepository(User)
        // private userRepository: Repository<User>,
        // @InjectRepository(Todo)
        // private todoRepository: Repository<Todo>, 
    ) {}

    // READ
    async findAllByUser(user_id: number): Promise<Notification[]> {
        const notifications = await this.notificationRepository.createQueryBuilder('notification')
        .leftJoinAndSelect(User, 'sender', 'sender.user_id::text = notification.sender_id')
        .leftJoinAndSelect(User, 'receiver', 'receiver.user_id::text = notification.receiver_id')
        .leftJoinAndSelect(Todo, 'todo', `todo.todo_id::text = notification.sub_id AND (notification.noti_type = '2' OR notification.noti_type = '3')`)
        .select([
          'notification.noti_id',
          'notification.noti_time',
          'notification.noti_type',
          'notification.req_type',
          'notification.sub_id',
          'sender.user_name AS sender_name',
          'receiver.user_name AS receiver_name',
          'todo.todo_name AS todo_name',
        ])
        .where('notification.receiver_id = :user_id::text', { user_id })
        .orderBy('notification.noti_time', 'DESC')
        .getRawMany();
  
      return notifications.map(noti => ({
        ...noti,
        todo_name: noti.noti_type === '2' || noti.noti_type === '3' ? noti.todo_name : null,
      }));
    }

    // CREATE
    async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = new Notification();
        const now = new Date();

        notification.sender_id = createNotificationDto.sender_id;
        notification.receiver_id = createNotificationDto.receiver_id;
        notification.noti_type = createNotificationDto.noti_type;
        notification.req_type = createNotificationDto.req_type;
        notification.sub_id = createNotificationDto.sub_id;
        notification.noti_time = now;

        return await this.notificationRepository.save(notification);
    }

    // UPDATE
    async updateNotification(noti_id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({ where: { noti_id } });
        if (notification) {
            notification.req_type = updateNotificationDto.req_type;
            await this.notificationRepository.save(notification);            
            return notification;
        }
    }
}