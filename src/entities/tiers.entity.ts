import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('tiers')
export class Tier {
  @PrimaryColumn()
  tier_min: number;

  @PrimaryColumn()
  tier_max: number;

  @Column()
  tier_img: string;

  @Column()
  tier_name: string;
}