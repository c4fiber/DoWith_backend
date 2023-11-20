import { IsNotEmpty } from "class-validator";

export class CreateUserGroupDto {
  @IsNotEmpty()
  grp_id: number;

  @IsNotEmpty()
  user_id: number;  
}