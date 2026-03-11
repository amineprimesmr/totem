import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateOfferDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  sector: string;

  @ApiPropertyOptional()
  @IsString()
  jobTitle: string;

  @ApiPropertyOptional()
  @IsString()
  formation: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contractType?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
