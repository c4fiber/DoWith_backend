import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entities';

@Entity()
export class Comment {
	@PrimaryGeneratedColumn()
	noti_id: number;

	@Column()
	receiver_id: number;

	@Column()
	sender_id: number;

	@Column()
	noti_type : number;

    @Column()
    req_type : number;

	@Column()
	noti_time: Date;

	@Column()
	sub_id: number;
}