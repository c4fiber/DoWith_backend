import { IsNotEmpty } from 'class-validator';

export class GetUsersByContactsDto {
  @IsNotEmpty()
  contacts: string[];
}
