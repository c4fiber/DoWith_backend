import { Group } from "src/group/entities/group.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Routine {
  @PrimaryGeneratedColumn()
  rout_id: number;

  @Column()
  rout_name: string;

  @Column({nullable: true})
  rout_desc: string;

  @Column({ type: 'bit varying', width: 7 })
  rout_repeat: string;

  @Column({nullable: true, type: 'time'})
  rout_srt: string;

  @Column({nullable: true, type: 'time'})
  rout_end: string;

  @ManyToOne(() => Group, grp => grp.rout_id)
  @JoinColumn({ name: 'grp_id' })
  grp_id: Group;
}