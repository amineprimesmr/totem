import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@totem/database';
import { MessagesService } from './messages.service';
import { Request } from 'express';
import twilio from 'twilio';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Post('campaigns/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION, UserRole.COMMERCIAL)
  preview(
    @Body()
    body: {
      direction: 'CANDIDATE_TO_COMPANIES' | 'COMPANY_TO_CANDIDATES';
      selectedEntityId: string;
      channel?: 'EMAIL' | 'SMS';
      maxItems?: number;
    },
  ) {
    this.ensureEnabled();
    return this.messages.previewCampaign(body);
  }

  @Post('campaigns/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION, UserRole.COMMERCIAL)
  send(
    @Body()
    body: {
      direction: 'CANDIDATE_TO_COMPANIES' | 'COMPANY_TO_CANDIDATES';
      selectedEntityId: string;
      channel?: 'EMAIL' | 'SMS';
      maxItems?: number;
      name?: string;
    },
    @CurrentUser() user: any,
  ) {
    this.ensureEnabled();
    return this.messages.sendCampaign(body, user.id);
  }

  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION, UserRole.COMMERCIAL)
  getOne(@Param('id') id: string) {
    this.ensureEnabled();
    return this.messages.getCampaign(id);
  }

  @Post('campaigns/:id/retry-failed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION, UserRole.COMMERCIAL)
  retryFailed(@Param('id') id: string, @CurrentUser() user: any) {
    this.ensureEnabled();
    return this.messages.retryFailed(id, user.id);
  }

  @Post('webhooks/twilio/status')
  twilioStatusWebhook(
    @Req() req: Request,
    @Headers('x-twilio-signature') signature: string | undefined,
    @Body()
    body: {
      MessageSid?: string;
      MessageStatus?: string;
      ErrorMessage?: string;
    },
  ) {
    this.assertTwilioSignature(req, signature, body);
    if (!body?.MessageSid || !body?.MessageStatus) return { ok: true, ignored: true };
    return this.messages.applyTwilioStatus(
      body.MessageSid,
      body.MessageStatus,
      body.ErrorMessage,
    );
  }

  private ensureEnabled() {
    if (process.env.MESSAGING_CAMPAIGNS_ENABLED === 'false') {
      throw new ForbiddenException('MESSAGING_CAMPAIGNS_ENABLED=false');
    }
  }

  private assertTwilioSignature(
    req: Request,
    signature: string | undefined,
    body: Record<string, unknown>,
  ) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) return;
    if (!signature) throw new ForbiddenException('Missing Twilio signature');
    const callbackUrl =
      process.env.TWILIO_STATUS_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = twilio.validateRequest(authToken, signature, callbackUrl, body);
    if (!isValid) throw new ForbiddenException('Invalid Twilio signature');
  }
}
