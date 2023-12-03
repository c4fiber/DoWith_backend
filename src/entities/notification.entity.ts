import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('notification')
export class Notification {
	@PrimaryGeneratedColumn()
	noti_id: number;

	@Column()
	receiver_id: string;

	@Column()
	sender_id: string;

	@Column()
	noti_type : string;

    @Column()
    req_type : string;

	@Column()
	noti_time: Date;

	@Column()
	sub_id: string;
}