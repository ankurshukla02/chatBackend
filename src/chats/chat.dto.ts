import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
export class CreateChatDto {
  @ApiProperty() @IsUUID() userAId!: string;
  @ApiProperty() @IsUUID() userBId!: string;
}
export class SendMessageDto {
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text!: string;
}
export class ReadMessageDto {
  @ApiProperty() @IsUUID() userId!: string;
}
export class LastSeenDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiProperty() @IsString() messageId!: string;
}
export class MessageQueryDto {
  @ApiProperty({ required: false, default: 50, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cursor?: string;
}
