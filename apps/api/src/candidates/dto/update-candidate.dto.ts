import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreateCandidateDto } from './create-candidate.dto';

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {
  @ApiPropertyOptional({ enum: ['REGISTERED', 'SEARCHING', 'IN_PROCESS', 'SIGNED'] })
  @IsOptional()
  @IsString()
  @IsIn(['REGISTERED', 'SEARCHING', 'IN_PROCESS', 'SIGNED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promotionId?: string | null;
}
