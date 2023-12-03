import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn()
  anno_id: number;

  @Column()
  title: string;
  
  @Column()
  content: string;

  @Column({ nullable: true })
  anno_img: string;

  @CreateDateColumn()
  reg_at: Date;
}