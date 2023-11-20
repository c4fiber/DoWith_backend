import { IsNotEmpty } from "class-validator";

export class CreateRoutineDto {
  @IsNotEmpty()
  rout_id: number;

  @IsNotEmpty()
  rout_name: string;

  rout_desc: string;
  rout_repeat: number;
  rout_start: Date;
  rout_end: Date;
}