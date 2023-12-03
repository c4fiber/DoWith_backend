import { Module } from '@nestjs/common';
import { AppGateway } from "./app.gateway";
import { UserModule } from 'src/user/user.module';
import { GroupModule } from 'src/group/group.module';
import { TodoModule } from 'src/todo/todo.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [UserModule, GroupModule, TodoModule, NotificationModule],
    providers: [AppGateway],
    exports: [AppGateway],
})
export class GatewayModule {}