import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startedAt = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const smtpReady =
      Boolean(process.env.SMTP_HOST) &&
      Boolean(process.env.SMTP_USER) &&
      Boolean(process.env.SMTP_PASS);
    const twilioReady =
      Boolean(process.env.TWILIO_ACCOUNT_SID) &&
      Boolean(process.env.TWILIO_AUTH_TOKEN) &&
      Boolean(process.env.TWILIO_FROM_NUMBER);
    const mapboxReady =
      Boolean(process.env.MAPBOX_TOKEN) || Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
    return {
      status: 'ok',
      service: 'totem-api',
      timestamp: new Date().toISOString(),
      db: 'up',
      latencyMs: Date.now() - startedAt,
      readiness: {
        smtp: smtpReady ? 'ready' : 'missing',
        twilio: twilioReady ? 'ready' : 'missing',
        mapbox: mapboxReady ? 'ready' : 'missing',
        messagingCampaignsEnabled: process.env.MESSAGING_CAMPAIGNS_ENABLED === 'true',
      },
    };
  }
}
