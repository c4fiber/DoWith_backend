import { IsNotEmpty } from "class-validator";

export class CreateCommentDto {
	@IsNotEmpty()
	owner_id: string;

	@IsNotEmpty()
	author_id: string;

	@IsNotEmpty()
	content: string;
}