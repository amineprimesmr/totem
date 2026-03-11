import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreatePromotionDto {
  @ApiProperty()
  @IsString()
  formationId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  year: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  capacity?: number;
}
