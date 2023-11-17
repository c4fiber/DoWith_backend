import { Group } from "src/group/entities/group.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Routine {
  @PrimaryGeneratedColumn()
  rout_id: number;
  
  @Column()
  rout_name: string;

  @Column()
  rout_desc: string;

  @Column()
  rout_repeat: number;

  @CreateDateColumn()
  rout_start: Date;

  @CreateDateColumn()
  rout_end: Date;

  @ManyToOne(type => Group, group => group.grp_rout)
  group: Group;

  // 시간 포맷팅 해서 가지고 있을 수 있을듯 (정해져야 확실히 할텐데)
  // @BeforeInsert()
  // @BeforeUpdate()
  // updateDates() {
  //   // 형식을 지정하여 시간만 가져오기
  //   this.rout_start = this.rout_start.toTimeString().split(' ')[0];
  // }
}