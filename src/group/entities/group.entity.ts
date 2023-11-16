import { Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  group_id: number;
    
  @Column({ nullable: false })
  grp_name: string;

  @Column({ nullable: false })
  grp_decs: string;

  @Column({ nullable: false })
  grp_owner: string;

  @Column({ nullable: false })
  grp_cat: string;

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

  // 한 유저가 여러 그룹 가입 UserGroup @OneToMany: user_id (이건 OneToOne 인듯 Group 테이블 입장에서)
  // 한 그룹당 여러개의 루틴 Routine @OneToMany: rout_id
  // 한 유저가 여러 그룹 소유 User @ManyToOne: user_id
}