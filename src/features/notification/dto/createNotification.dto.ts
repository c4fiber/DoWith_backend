import { IsNotEmpty } from "class-validator";

export class CreateNotificationDto {
	@IsNotEmpty()
	receiver_id: string;

	@IsNotEmpty()
	sender_id: string;

	@IsNotEmpty()
	noti_type: string;

    @IsNotEmpty()
    req_type: string;

    @IsNotEmpty()
    sub_id: string;
}