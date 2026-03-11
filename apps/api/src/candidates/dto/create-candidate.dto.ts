import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsDateString, IsIn } from 'class-validator';

export class CreateCandidateDto {
  @ApiPropertyOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  firstName: string;

  @ApiPropertyOptional()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  formation: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  level?: string;

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
  @IsNumber()
  @IsOptional()
  searchRadiusKm?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  sectors?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  desiredJob?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contractType?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  availableFrom?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cvPath?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverLetterPath?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'REGISTERED | SEARCHING | IN_PROCESS | SIGNED' })
  @IsString()
  @IsOptional()
  @IsIn(['REGISTERED', 'SEARCHING', 'IN_PROCESS', 'SIGNED'])
  status?: string;
}
