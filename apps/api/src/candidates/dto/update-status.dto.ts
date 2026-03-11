import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ enum: ['REGISTERED', 'SEARCHING', 'IN_PROCESS', 'SIGNED'] })
  @IsIn(['REGISTERED', 'SEARCHING', 'IN_PROCESS', 'SIGNED'])
  status: string;
}
