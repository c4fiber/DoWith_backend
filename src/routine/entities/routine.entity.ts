import { Days } from "src/days/entities/days.entity";
import { Group } from "src/group/entities/group.entity";
import { Todo } from "src/todo/todo.entity";
import { Column, Entity, CreateDateColumn, ManyToOne, DeleteDateColumn, JoinColumn, PrimaryGeneratedColumn, ManyToMany } from "typeorm";

@Entity('routine')
export class Routine {
  @PrimaryGeneratedColumn()
  rout_id: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'grp_id', referencedColumnName: 'grp_id' })
  grp_id: number;

  @Column()
  rout_name: string;

  @Column({nullable: true})
  rout_desc: string;

  @ManyToOne(() => Days)
  @JoinColumn({ name: 'rout_repeat', referencedColumnName: 'rout_repeat' })
  rout_repeat: string;

  @Column({nullable: true, type: 'time'})
  rout_srt: string;

  @Column({nullable: true, type: 'time'})
  rout_end: string;

  @CreateDateColumn()
  reg_at: Date;

  @DeleteDateColumn()
  del_at: Date;
}