import { Module, forwardRef } from '@nestjs/common';
import { AppGateway } from "./app.gateway";
import { NotificationModule } from 'src/features/notification/notification.module';
import { UserModule } from 'src/features/user/user.module';
import { GroupModule } from 'src/features/group/group.module';
import { TodoModule } from 'src/features/todo/todo.module';

@Module({
    imports: [UserModule, GroupModule, TodoModule, forwardRef(() => NotificationModule)],
    providers: [AppGateway],
    exports: [AppGateway],
})
export class GatewayModule {}