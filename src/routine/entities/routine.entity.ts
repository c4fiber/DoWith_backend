import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Routine {
  @PrimaryGeneratedColumn()
  rout_id: number;
  
  @Column()
  grp_id: number;

  @Column()
  rout_name: string;

  @Column()
  rout_desc: string;

  @Column()
  rout_repeat: number;

  @CreateDateColumn()
  rout_srt: Date;

  @CreateDateColumn()
  rout_end: Date;

  @DeleteDateColumn()
  deletedAt: Date
}