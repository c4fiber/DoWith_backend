// app.gateway.ts

import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from '../features/notification/notification.service';
import { UserService } from 'src/features/user/user.service';
import { TodoService } from 'src/features/todo/todo.service';
import { GroupService } from 'src/features/group/group.service';
import { CreateNotificationDto } from 'src/features/notification/dto/createNotification.dto';
import { Comment } from 'src/entities/comment.entity';
import { Notification } from 'src/entities/notification.entity';
import { DataSource } from 'typeorm';
import { Todo } from 'src/entities/todo.entity';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class AppGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private userService: UserService,
    private todoService: TodoService,
    private groupService: GroupService,
    private notificationService: NotificationService,
    private readonly dataSource: DataSource,
    ) {}

	async handleConnection(client: Socket) {
		const socketId = client.id;
		let userId = client.handshake.query['user_id'];

		if (Array.isArray(userId)) {
			userId = userId[0];
		}
		// UserService를 통해 데이터베이스에 socketId 업데이트
		const userIdInt = parseInt(userId, 10); // 두 번째 인자 10은 10진수를 의미

		// 변환된 userId가 유효한 숫자인지 확인
		if (!isNaN(userIdInt)) {
			// UserService를 통해 데이터베이스에 socketId 업데이트
			await this.userService.updateSocketId(userIdInt, socketId);
		} else {
			// 유효하지 않은 userId 처리
			console.error('Invalid userId:', userId);
		}
	}

  @SubscribeMessage('friendRequest')
  async handleFriendRequest(@MessageBody() data: { senderId: number, receiverId: number}, @ConnectedSocket() client: Socket) {
    const sender = await this.userService.getUser( data.senderId );
    const receiver = await this.userService.getUser( data.receiverId );
    if (!sender || !receiver) {
        return;
    }

		const notificationData = new CreateNotificationDto();
    notificationData.sender_id = `${sender.user_id}`;
    notificationData.receiver_id = `${receiver.user_id}`;
    notificationData.noti_type = '0';
    notificationData.req_type = '0';
    notificationData.sub_id = '';

    const noti = await this.notificationService.createNotification(notificationData);

		try {
			this.server.to(receiver.socket_id).emit('friendRequest', { 
					message: `${sender.user_name}님이 친구 요청을 보냈습니다.`,
					senderId: sender.user_id,
          senderName: sender.user_name,
					receiverId: receiver.user_id,
          notiId: noti.noti_id}) ;
		} catch (error) {
			console.error(`Error sending notification to user ${receiver.user_id}:`, error);
		}				
  }

  async notifyFriendResponse(notification: Notification) {
    const sender = await this.userService.getUser( parseInt(notification.sender_id) );
    const receiver = await this.userService.getUser( parseInt(notification.receiver_id) );
    if (!sender || !receiver) {
        return;
    }

		const notificationData = new CreateNotificationDto();
    notificationData.sender_id = `${sender.user_id}`;
    notificationData.receiver_id = `${receiver.user_id}`;
    notificationData.noti_type = '1';
    notificationData.req_type = '1';
    notificationData.sub_id = '';

    await this.notificationService.createNotification(notificationData);

		try {
    	this.server.to(receiver.socket_id).emit('friendResponse', {
        message: `${sender.user_name}님이 친구 요청을 수락하였습니다.`,
        senderId: sender.user_id,
        senderName: sender.user_name,
        receiverId: receiver.user_id });
		} catch (error) {
			console.error(`Error sending notification to user ${receiver.user_id}:`, error);
		}
  }

  @SubscribeMessage('confirmRequest')
  async handleConfirmRequest(@MessageBody() data: { userId: number; todoId: number}, @ConnectedSocket() client: Socket) {
    const sender = await this.userService.getUser( data.userId );
    if (!sender) {
      return;
    }

    const todo = await this.todoService.findOne( data.todoId );
    if (!todo) {
      return;
    }

    const groupMembers = await this.groupService.findUsersByGroupId( todo.grp_id );

    for (const member of groupMembers) {
      if (member.user_id !== sender.user_id ) {
        const notificationData = new CreateNotificationDto();
        notificationData.sender_id = `${sender.user_id}`;
        notificationData.receiver_id = `${member.user_id}`;
        notificationData.noti_type = '2';
        notificationData.req_type = `${todo.todo_img}`;
        notificationData.sub_id = `${todo.todo_id}`;
        
        await this.notificationService.createNotification(notificationData);

        // 해당 to-do를 공유하는 사용자들에게 알림 전송
        try {
            this.server.to(member.socket_id).emit('confirmRequest', {
                message: `${sender.user_name}님이 ${todo.todo_name}에 대한 인증을 요청했습니다.`,
                senderId: sender.user_id,
                senderName: sender.user_name,
                todoId: todo.todo_id,
                todoName: todo.todo_name,
                todoImg: todo.todo_img,
            });
        } catch (error) {
            console.error('Error sending notification to user ${member.user_id}:', error);
        }
      }
    }
  }

  @SubscribeMessage('routineConfirmRequest')
  async handleRoutineConfirmRequest(@MessageBody() data: { userId: number; routId: number}, @ConnectedSocket() client: Socket) {
    const sender = await this.userService.getUser( data.userId );
    if (!sender) {
      return;
    }

    const today = new Date();
    const todo = await this.dataSource.getRepository(Todo).findOne({
                                        where: {
                                            rout_id: data.routId, 
                                            todo_date: today,
                                            user_id: data.userId,
                                        }});
    if (!todo) {
      return;
    }

    const groupMembers = await this.groupService.findUsersByGroupId( todo.grp_id );

    for (const member of groupMembers) {
      if (member.user_id !== sender.user_id ) {
        const notificationData = new CreateNotificationDto();
        notificationData.sender_id = `${sender.user_id}`;
        notificationData.receiver_id = `${member.user_id}`;
        notificationData.noti_type = '2';
        notificationData.req_type = `${todo.todo_img}`;
        notificationData.sub_id = `${todo.todo_id}`;
        
        await this.notificationService.createNotification(notificationData);

        // 해당 to-do를 공유하는 사용자들에게 알림 전송
        try {
            this.server.to(member.socket_id).emit('confirmRequest', {
                message: `${sender.user_name}님이 ${todo.todo_name}에 대한 인증을 요청했습니다.`,
                senderId: sender.user_id,
                senderName: sender.user_name,
                todoId: todo.todo_id,
                todoName: todo.todo_name,
                todoImg: todo.todo_img,
            });
        } catch (error) {
            console.error('Error sending notification to user ${member.user_id}:', error);
        }
      }
    }
  }


  @SubscribeMessage('confirmResponse')
  async handleConfirmResponse(@MessageBody() data: { userId: number, todoId: number }, @ConnectedSocket() client: Socket) {
    // 인증샷 업로드 로직
    // 예: data.userId가 공유한 to-do에 대한 인증샷을 업로드했다고 가정
    const sender = await this.userService.getUser( data.userId );
    if (!sender) {
        return;
    }

    const todo = await this.todoService.findOne( data.todoId );
    if (!todo) {
        return;
    }

    const receiver = await this.userService.getUser( todo.user_id );

    const notificationData = new CreateNotificationDto();
    notificationData.sender_id = `${sender.user_id}`;
    notificationData.receiver_id = `${todo.user_id}`;
    notificationData.noti_type = '3';
    notificationData.req_type = '0';
    notificationData.sub_id = `${todo.todo_id}`;

    await this.notificationService.createNotification(notificationData);
    // 해당 to-do를 공유하는 사용자들에게 알림 전송
		try {
			this.server.to(receiver.socket_id).emit('confirmResponse', {
					message: `${sender.user_name}님이 ${todo.todo_name}에 대한 인증을 완료하였습니다.`,
					senderId: sender.user_id,
          senderName: sender.user_name,
          receiverId: receiver.user_id,
					todoId: todo.todo_id,
          totoName: todo.todo_name, });
		} catch (error) {
			console.error(`Error sending notification to user ${receiver.user_id}:`, error);
		}
  }

  // @SubscribeMessage('newComment')
  // async handleNewComment(@MessageBody() data: {userId: number, ownerId: number}, @ConnectedSocket() client: Socket) {

  // }
	async notifyComment(comment: Comment) {
		const author = await this.userService.getUser( comment.author_id );
		if (!author) {
			return;
		}

		const receiver = await this.userService.getUser( comment.owner_id );
		if (!receiver) {
			return;
		}

    const notificationData = new CreateNotificationDto();
    notificationData.sender_id = `${comment.author_id}`;
    notificationData.receiver_id = `${comment.owner_id}`;
    notificationData.noti_type = '4';
    notificationData.req_type = '0';
    notificationData.sub_id = `${comment.com_id}`;

    await this.notificationService.createNotification(notificationData);

		try {
			this.server.to(receiver.socket_id).emit('newComment', {
				message: `${author.user_name}님이 방명록에 댓글을 남겼습니다.`,
				authorId: author.user_id,
        authorName: author.user_name,
				comId: comment.com_id,
			})
		} catch (error) {
			console.error(`Error sending notification to user ${receiver.user_id}:`, error);
		}
	}
}