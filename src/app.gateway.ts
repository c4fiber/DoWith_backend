// app.gateway.ts

import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification/notification.service';
import { TodoService } from './todo/todo.service';
import { UserService } from './user/user.service';
import { GroupService } from './group/group.service';
import { CreateNotificationDto } from './notification/dto/createNotification.dto';

@WebSocketGateway()
export class AppGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private notificationService : NotificationService,
    private todoService : TodoService,
    private userService: UserService,
    private groupService: GroupService) {}

	async handleConnection(client: Socket) {
		const socketId = client.id;
		const userId = client.handshake.query.id;

		// UserService를 통해 데이터베이스에 socketId 업데이트
		await this.userService.updateSocketId(userId, socketId);
	}

  @SubscribeMessage('friendRequest')
  async handleFriendRequest(@MessageBody() data: { senderId: number, receiverId: number}, @ConnectedSocket() client: Socket) {
    const sender = await this.userService.getUser( data.senderId );
    const receiver = await this.userService.getUser( data.receiverId );
    if (!sender || !receiver) {
        return;
    }

		const notificationData = new CreateNotificationDto();
    notificationData.sender_id = data.senderId.toString();
    notificationData.receiver_id = data.receiverId.toString();
    notificationData.noti_type = '0';
    notificationData.req_type = '0';
    notificationData.sub_id = '';

    await this.notificationService.createNotification(notificationData);

		try {
			this.server.to(receiver.socket_id).emit('friendRequest', { 
					message: `${sender.user_name}이 친구 요청을 보냈습니다.`,
					senderId: data.senderId,
					receiverId: data.receiverId }) ;
		} catch (error) {
			console.error(`Error sending notification to user ${receiver.user_id}:`, error);
		}				
  }

  @SubscribeMessage('friendResponse')
  async handleFriendResponse(@MessageBody() data: { senderId: number, receiverId: number}, @ConnectedSocket() client: Socket) {
    const sender = await this.userService.getUser( data.senderId );
    const receiver = await this.userService.getUser( data.receiverId );
    if (!sender || !receiver) {
        return;
    }

		const notificationData = new CreateNotificationDto();
    notificationData.sender_id = data.senderId.toString();
    notificationData.receiver_id = data.receiverId.toString();
    notificationData.noti_type = '1';
    notificationData.req_type = '0';
    notificationData.sub_id = '';

    await this.notificationService.createNotification(notificationData);

		try {
    	this.server.to(receiver.socket_id).emit('friendResponse', {
        message: `${sender.user_name}이 친구 요청을 수락하였습니다.`,
        senderId: data.senderId,
        receiverId: data.receiverId });
		} catch (error) {
			console.error(`Error sending notification to user ${receiver.user_id}:`, error);
		}
  }

  @SubscribeMessage('confirmRequest')
  async handleConfirmRequest(@MessageBody() data: { userId: number; todoId: number; photoUrl: string }, @ConnectedSocket() client: Socket) {
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
        if (member.user_id !== data.userId ) {
            const notificationData = new CreateNotificationDto();
            notificationData.sender_id = data.userId.toString();
            notificationData.receiver_id = member.user_id.toString();
            notificationData.noti_type = '2';
            notificationData.req_type = '0';
            notificationData.sub_id = data.todoId.toString();
            
            await this.notificationService.createNotification(notificationData);

            // 해당 to-do를 공유하는 사용자들에게 알림 전송
            try {
                this.server.to(member.socketId).emit('confirmRequest', {
                    message: `${member.user_name}이 ${todo.todo_name}에 대한 인증을 요청했습니다.`,
                    senderId: data.userId,
                    todoId: data.todoId,
                    photoUrl: data.photoUrl
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
    notificationData.sender_id = data.userId.toString();
    notificationData.receiver_id = todo.user_id.toString();
    notificationData.noti_type = '3';
    notificationData.req_type = '0';
    notificationData.sub_id = data.todoId.toString();

    await this.notificationService.createNotification(notificationData);
    // 해당 to-do를 공유하는 사용자들에게 알림 전송
		try {
			this.server.to(receiver.socketId).emit('confirmResponse', {
					message: `${sender.user_name}이 ${todo.todo_name}에 대한 인증을 완료하였습니다.`,
					userId: data.userId,
					todoId: data.todoId });
		} catch (error) {
			console.error(`Error sending notification to user ${receiver.user_id}:`, error);
		}
  }

  @SubscribeMessage('newComment')
  async handleNewComment(@MessageBody() data: {userId: number, ownerId: number}, @ConnectedSocket() client: Socket) {

  }
}