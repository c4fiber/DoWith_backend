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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update_comment.dto';
import { Comment } from '../entities/comment.entity';

@Controller('guestbook')
export class CommentController {
    constructor(private commentService: CommentService) {}
    @Get(':owner_id/comment')
    findAllByOwner(
        @Param('owner_id', ParseIntPipe) owner_id: number,
    ): Promise<Comment[]> {
        return this.commentService.findAllByOwner(owner_id);
    }

    @Post(':owner_id/comment')
    create(
        @Param('owner_id', ParseIntPipe) owner_id: number,
        @Body() createCommentDto: CreateCommentDto
    ): Promise<Comment> {
        return this.commentService.createComment(createCommentDto);
    }

    @Put(':owner_id/comment/:com_id')
    update(
        @Param('com_id', ParseIntPipe) com_id: number,
        @Body() updateCommentDto: UpdateCommentDto,
    ): Promise<Comment> {
        return this.commentService.updateComment(com_id, updateCommentDto);
    }

    @Patch(':owner_id/comment/:com_id')
    delete(
        @Param('owner_id', ParseIntPipe) owner_id: number,
        @Param('com_id', ParseIntPipe) com_id: number
    ): Promise<Comment> {
        return this.commentService.deleteComment(com_id);
    }
}