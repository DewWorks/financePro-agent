
import { IsString, IsObject, IsOptional } from 'class-validator';

export class ChatRequestDto {
    @IsString()
    sessionId: string;

    @IsString()
    message: string;

    @IsOptional()
    @IsObject()
    contextSnapshot?: any;
}
