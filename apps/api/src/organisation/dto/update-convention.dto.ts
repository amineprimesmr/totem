import { PartialType } from '@nestjs/swagger';
import { CreateConventionDto } from './create-convention.dto';

export class UpdateConventionDto extends PartialType(CreateConventionDto) {}
