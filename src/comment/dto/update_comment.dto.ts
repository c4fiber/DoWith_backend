import { IsString } from "class-validator";

export class UpdateCommentDto {
    @IsString()
    readonly content: string;
}