import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { EmailsModule } from '../emails/emails.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [EmailsModule, MatchesModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
