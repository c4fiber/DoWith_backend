import { IsNotEmpty } from "class-validator";

export class CreateGroupDto {
  @IsNotEmpty()
  grp_id: number;

  @IsNotEmpty()
  grp_name: string;

  grp_decs: string;

  @IsNotEmpty()
  grp_owner: number;

  @IsNotEmpty()
  grp_cat: string;
}