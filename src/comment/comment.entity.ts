import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}