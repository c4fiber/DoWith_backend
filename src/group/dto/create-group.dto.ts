import { IsNotEmpty } from "class-validator";

export class CreateGroupDto {
  @IsNotEmpty()
  group_id: number;

  @IsNotEmpty()
  grp_name: string;

  grp_decs: string;

  @IsNotEmpty()
  grp_owner: string;

  @IsNotEmpty()
  grp_cat: string;
}