import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentType } from '@totem/database';

export class CreateDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  candidateId?: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  filePath: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mimeType?: string;
}
