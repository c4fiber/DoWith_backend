import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class UserGroup {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  ache_id: number;
}