import { time } from "console";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Routine {
  @PrimaryGeneratedColumn()
  rout_id: number;
  
  @Column()
  grp_id: number;

  @Column()
  rout_name: string;

  @Column({nullable: true})
  rout_desc: string;

  @Column()
  rout_repeat: number;

  @Column({nullable: true, type: 'time'})
  rout_srt: string;

  @Column({nullable: true, type: 'time'})
  rout_end: string;
}