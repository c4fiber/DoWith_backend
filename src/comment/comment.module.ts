import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from './comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), GatewayModule],
  controllers: [CommentController],
  providers: [CommentService, DoWithExceptions],
  exports: [CommentService],
})
export class CommentModule {}