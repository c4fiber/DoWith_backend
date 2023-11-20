import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../user/user.entities';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update_comment.dto';

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
            },
            relations: ['author'],
        });
    }

    // CREATE
    async createComment(createCommentDto: CreateCommentDto): Promise<Comment> {
        const comment = new Comment();
        const now = new Date();

        comment.owner_id = parseInt(createCommentDto.owner_id);
        comment.author_id = parseInt(createCommentDto.author_id);

        if (isNaN(comment.owner_id) || isNaN(comment.author_id)) {
            throw new Error("Invalid owner_id or author_id");
        }
    
        comment.content = createCommentDto.content;
        comment.reg_at = now;
        comment.is_mod = false;
        comment.is_del = false;

        return await this.commentRepository.save(comment);
    }

    // UPDATE
    async updateComment(com_id: number, updateCommentDto: UpdateCommentDto): Promise<Comment> {
        const comment = await this.commentRepository.findOne({ where: { com_id } });
        if (comment) {
            comment.content = updateCommentDto.content;
            comment.is_mod = true;
            await this.commentRepository.save(comment);
            return comment;
        }
    }

    // DELETE
    async deleteComment(com_id: number): Promise<Comment> {
        const comment = await this.commentRepository.findOne({ where: { com_id } });
        if (comment) {
            comment.is_del = true;
            await this.commentRepository.save(comment);
            return comment
        }
    }
}