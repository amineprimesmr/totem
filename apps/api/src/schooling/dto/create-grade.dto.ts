import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateGradeDto {
  @ApiProperty()
  @IsString()
  candidateId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  scale?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  coefficient?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;
}
