import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchingService } from './matching.service';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [EmailsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchingService],
  exports: [MatchesService, MatchingService],
})
export class MatchesModule {}
