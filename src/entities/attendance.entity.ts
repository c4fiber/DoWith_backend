import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Attendance {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn({ default:() => `to_char(now(), 'yyyyMMdd')`})
  atte_at: string;
}
