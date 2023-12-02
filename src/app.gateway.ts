// app.gateway.ts

import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class AppGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('friendRequest')
  handleFriendRequest(@MessageBody() data: { senderId: string, receiverId: string}, @ConnectedSocket() client: Socket): void {
    this.server.emit('friendRequest', { senderId: data.senderId, receiverId: data.receiverId }) ;
  }

  @SubscribeMessage('friendResponse')
  handleFriendResponse(@MessageBody() data: { senderId: string, receiverId: string}, @ConnectedSocket() client: Socket): void {
    this.server.emit('friendResponse', { senderId: data.senderId, receiverId: data.receiverId }) ;
  }

  @SubscribeMessage('confirmRequest')
  handleConfirmRequest(@MessageBody() data: { userId: string; photoUrl: string }, @ConnectedSocket() client: Socket): void {
    // 인증샷 업로드 로직
    // 예: data.userId가 공유한 to-do에 대한 인증샷을 업로드했다고 가정

    // 해당 to-do를 공유하는 사용자들에게 알림 전송
    this.server.emit('confirmRequest', { userId: data.userId, photoUrl: data.photoUrl });
  }

  @SubscribeMessage('confirmResponse')
  handleConfirmResponse(@MessageBody() data: { userId: string; photoUrl: string }, @ConnectedSocket() client: Socket): void {
    // 인증샷 업로드 로직
    // 예: data.userId가 공유한 to-do에 대한 인증샷을 업로드했다고 가정

    // 해당 to-do를 공유하는 사용자들에게 알림 전송
    this.server.emit('confirmResponse', { userId: data.userId, photoUrl: data.photoUrl });
  }
}
