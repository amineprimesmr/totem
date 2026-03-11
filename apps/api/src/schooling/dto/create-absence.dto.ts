import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { AbsenceType } from '@totem/database';

export class CreateAbsenceDto {
  @ApiProperty()
  @IsString()
  candidateId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: AbsenceType })
  @IsEnum(AbsenceType)
  @IsOptional()
  type?: AbsenceType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  justified?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
