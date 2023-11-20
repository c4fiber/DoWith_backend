import { IsNotEmpty } from "class-validator";

export class CreateCommentDto {
	@IsNotEmpty()
	owner_id: number;

	@IsNotEmpty()
	author_id: number;

	@IsNotEmpty()
	content: string;

    @IsNotEmpty()
	reg_at: Date;

	upt_at: Date;

    @IsNotEmpty()
	is_del: boolean;
}