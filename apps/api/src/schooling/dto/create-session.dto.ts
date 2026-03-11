import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SessionType } from '@totem/database';

export class CreateSessionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  promotionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startAt: string;

  @ApiProperty()
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({ enum: SessionType })
  @IsEnum(SessionType)
  @IsOptional()
  type?: SessionType;
}
