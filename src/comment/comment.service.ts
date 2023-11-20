import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../user/user.entities';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) {}

    // READ
    async findAllByOwner(owner_id: number): Promise<Comment[]> {
        return await this.commentRepository.find({
            where: {
                owner_id: owner_id,
                is_del: false
            }
        });
    }

    // CREATE
    async createComment(createCommentDto: CreateCommentDto): Promise<Comment> {
        const comment = new Comment();
        const now = new Date();

        comment.owner_id = createCommentDto.owner_id;
        comment.author_id = createCommentDto.author_id;
        comment.content = createCommentDto.content;
        comment.reg_at = now;
        comment.is_mod = false;
        comment.is_del = false;

        return await this.commentRepository.save(comment);
    }

    // UPDATE
    async updateComment(com_id: number, createCommentDto: CreateCommentDto): Promise<Comment> {
        const comment = await this.commentRepository.findOneBy({ com_id });

        comment.content = createCommentDto.content;
        comment.is_mod = true;

        return await this.commentRepository.save(comment);
    }

    // DELETE
    async deleteComment(com_id: number, createCommentDto: CreateCommentDto): Promise<Comment> {
        const comment = await this.commentRepository.findOneBy({ com_id });
        comment.is_del = true;

        return await this.commentRepository.save(comment);
    }
}