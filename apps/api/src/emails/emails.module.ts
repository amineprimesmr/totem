import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { RelancesService } from './relances.service';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService, RelancesService],
  exports: [EmailsService],
})
export class EmailsModule {}
