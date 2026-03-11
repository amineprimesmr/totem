import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsObject, IsNumber, IsArray } from 'class-validator';

export class RegisterCandidateDto {
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
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postalCode?: string;

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
  @IsNumber()
  @IsOptional()
  searchRadiusKm?: number;
}

export class RegisterCompanyDto {
  @ApiPropertyOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  sector: string;

  @ApiPropertyOptional()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}

export class RegisterDto {
  @ApiPropertyOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ['CANDIDATE', 'COMPANY'] })
  @IsString()
  role: string;

  @ApiPropertyOptional({ type: RegisterCandidateDto })
  @IsObject()
  @IsOptional()
  candidate?: RegisterCandidateDto;

  @ApiPropertyOptional({ type: RegisterCompanyDto })
  @IsObject()
  @IsOptional()
  company?: RegisterCompanyDto;
}
