import { Days } from "src/days/entities/days.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('routine')
export class Routine {
  @PrimaryGeneratedColumn()
  rout_id: number;
  
  @Column()
  grp_id: number;

  @Column()
  rout_name: string;

  @Column({nullable: true})
  rout_desc: string;

  @OneToOne(() => Days)
  @JoinColumn({ name: 'rout_repeat'})
  days: Days;

  @Column({nullable: true, type: 'time'})
  rout_srt: string;

  @Column({nullable: true, type: 'time'})
  rout_end: string;
}