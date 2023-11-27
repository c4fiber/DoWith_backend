import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('days')
export class Days {
  @PrimaryColumn({ type: 'bit varying', width: 7 })
  rout_repeat: number;
  
  @Column()
  days: string;
}