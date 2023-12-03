import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from './comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoWithExceptions } from 'src/do-with-exception/do-with-exception';
import { AppGateway } from 'src/app.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), AppGateway],
  controllers: [CommentController],
  providers: [CommentService, DoWithExceptions],
  exports: [CommentService],
})
export class CommentModule {}