import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ConventionStatus } from '@totem/database';

export class CreateConventionDto {
  @ApiProperty()
  @IsString()
  candidateId: string;

  @ApiProperty()
  @IsString()
  offerId: string;

  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  promotionId?: string;

  @ApiPropertyOptional({ enum: ConventionStatus })
  @IsEnum(ConventionStatus)
  @IsOptional()
  status?: ConventionStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  signedAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentPath?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
