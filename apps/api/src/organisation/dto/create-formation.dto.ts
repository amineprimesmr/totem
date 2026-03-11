import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ContractType } from '@totem/database';

export class CreateFormationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  level?: string;

  @ApiPropertyOptional({ enum: ContractType })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  durationMonths?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
