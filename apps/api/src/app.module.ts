import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CandidatesModule } from './candidates/candidates.module';
import { CompaniesModule } from './companies/companies.module';
import { OffersModule } from './offers/offers.module';
import { MatchesModule } from './matches/matches.module';
import { InterviewsModule } from './interviews/interviews.module';
import { EmailsModule } from './emails/emails.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DemoModule } from './demo/demo.module';
import { HealthController } from './health/health.controller';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IntegrationsModule,
    DemoModule,
    AuthModule,
    UsersModule,
    CandidatesModule,
    CompaniesModule,
    OffersModule,
    MatchesModule,
    InterviewsModule,
    EmailsModule,
    AuditModule,
    DashboardModule,
    NotificationsModule,
    MessagesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
