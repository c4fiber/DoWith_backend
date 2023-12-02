import { ItemType } from "src/entities/item-type.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ItemShop {
  @PrimaryGeneratedColumn()
  item_id: number;
  
  @Column()
  item_name: string;

  @Column()
  item_cost: number;

  @Column({ nullable: true })
  item_path: string;

  @Column()
  @ManyToMany(() => ItemType)
  @JoinColumn({ name: 'type_id', referencedColumnName: 'type_id' })
  type_id: number;
}