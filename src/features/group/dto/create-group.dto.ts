import { IsNotEmpty } from "class-validator";
import { Category } from "src/features/entities/category.entity";

export class CreateGroupDto {
  @IsNotEmpty()
  user_id: number;
  
  @IsNotEmpty()
  grp_name: string;

  grp_decs: string;

  @IsNotEmpty()
  grp_owner: number;

  @IsNotEmpty()
  cat_id: number;

  @IsNotEmpty()
  category: Category;
}