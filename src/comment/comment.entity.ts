import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entities';

@Entity()
export class Comment {
	@PrimaryGeneratedColumn()
	com_id: number;

	@Column()
	owner_id: number;

	@Column()
	author_id: number;

	@Column()
	content: string;

	@Column()
	reg_at: Date;

	@Column({ default: false })
	is_mod: boolean;

	@Column({ default: false })
	is_del: boolean;

	@ManyToOne(() => User, user => user.user_id)
    @JoinColumn({ name: 'author_id' })
    author: User;
}