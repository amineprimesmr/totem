import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  building?: string;
}
