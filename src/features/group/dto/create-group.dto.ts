import { IsNotEmpty } from "class-validator";
import { Category } from "src/entities/category.entity";

export class CreateGroupDto {
  @IsNotEmpty()
  user_id: number;
  
  @IsNotEmpty()
  grp_name: string;

  grp_desc: string;

  @IsNotEmpty()
  grp_owner: number;

  @IsNotEmpty()
  cat_id: number;
}