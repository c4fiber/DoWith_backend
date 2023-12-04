import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from '../../entities/comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayModule } from 'src/gateway/gateway.module';
import { DoWithExceptions } from 'src/utils/do-with-exception';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), GatewayModule],
  controllers: [CommentController],
  providers: [CommentService, DoWithExceptions],
  exports: [CommentService],
})
export class CommentModule {}