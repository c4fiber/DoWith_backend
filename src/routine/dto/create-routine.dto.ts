import { IsNotEmpty } from "class-validator";
import { Days } from "src/days/entities/days.entity";

export class CreateRoutineDto {
  @IsNotEmpty()
  rout_name: string;
  
  rout_desc: string;
  rout_repeat: Days;
  rout_srt: string;
  rout_end: string;
}