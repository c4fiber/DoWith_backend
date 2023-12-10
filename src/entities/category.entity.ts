import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  cat_id: number;

  @Column({ nullable: true })
  cat_img: string;

  @Column()
  cat_name: string;
}