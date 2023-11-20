import {
    Get,
    Post,
    Patch,
    Put,
    Delete,
    Controller,
    Logger,
    Body,
    Param,
    ParseIntPipe,
  } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';

@Controller('comment')
export class CommentController {
    constructor(private commentService: CommentService) {}
    @Get('/user/:owner_id/guestbook/comments')
    findAllByOwner(
        @Param('owner_id', ParseIntPipe) owner_id: number,
    ): Promise<Comment[]> {
        return this.commentService.findAllByOwner(owner_id);
    }

    @Post('/user/:owner_id/guestbook/contents')
    create(@Body() createCommentDto: CreateCommentDto
    ): Promise<Comment> {
        return this.commentService.createComment(createCommentDto);
    }

    @Put('/user/:owner_id/guestbook/comments/:com_id')
    update(

    ): Promise<Comment> {
        return
    }

    @Patch('/user/:owner_id/guestbook/comments/:com_id')
    delete(

    ): Promise<Comment> {
        return
    }

}