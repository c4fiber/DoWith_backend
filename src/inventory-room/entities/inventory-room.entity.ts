import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { ItemInventory } from 'src/item-inventory/entities/item-inventory.entity';

@Entity()
export class InventoryRoom {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  item_id: number;

  @OneToOne(() => ItemInventory, { cascade: true })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
  @JoinColumn({ name: 'item_id', referencedColumnName: 'item_id' })
  itemInventory: ItemInventory;
}
