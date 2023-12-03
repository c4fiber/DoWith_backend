import { IsNotEmpty } from "class-validator";

export class UpdateNotificationDto {
	@IsNotEmpty()
    noti_id: string;

    @IsNotEmpty()
    req_type: string;
}