import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('days')
export class Days {
  @PrimaryColumn({ type: 'bit varying', width: 7 })
  rout_repeat: string;

  @Column({ type: 'text', array: true, nullable: false })
  days: String[];
}