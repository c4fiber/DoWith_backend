import { Category } from 'src/category/entities/category.entity';
import { Routine } from 'src/routine/entities/routine.entity';
import { User } from 'src/user/user.entities';
import { Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable, JoinColumn, OneToOne, ManyToOne } from 'typeorm';

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  grp_id: number;
    
  @Column({ nullable: false })
  grp_name: string;

  @Column({ nullable: false })
  grp_decs: string;

  @Column({ nullable: false })
  grp_owner: number;

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

  @OneToOne(() => Category, {createForeignKeyConstraints: false})
  @JoinColumn({ name: 'cat_id'})
  category: Category;

  // @ManyToOne(() => Routine, {createForeignKeyConstraints: false})
  // @JoinColumn({ name: 'rout_id' })
  // grp_routs: Routine;

  @ManyToMany(() => User)
  @JoinTable({ 
    name : 'user_group',
    joinColumn: {
      name: 'grp_id',
      referencedColumnName: 'grp_id'
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'user_id'
    },
  })
  users: User[];
}