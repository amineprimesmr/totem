import { Module } from '@nestjs/common';
import { GaliaModule } from './galia/galia.module';

@Module({
  imports: [GaliaModule],
})
export class IntegrationsModule {}
