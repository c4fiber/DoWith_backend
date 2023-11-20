import { IsNotEmpty } from "class-validator";
import { Category } from "src/category/entities/category.entity";

export class CreateGroupDto {
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