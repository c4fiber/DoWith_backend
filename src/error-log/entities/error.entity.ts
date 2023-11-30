import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('error')
export class doWithError {
  @PrimaryGeneratedColumn()
  err_id: number;

  @Column()
  method: string;

  @Column()
  url: string;

  @Column()
  agent: string;

  @Column()
  ip: string;

  @Column()
  parameters: string;

  @Column()
  http_code: number;

  @Column({ nullable: true })
  err_code: string;

  @Column()
  err_name: string;
  
  @Column()
  err_stack: string;

  @CreateDateColumn()
  reg_at: Date;
}