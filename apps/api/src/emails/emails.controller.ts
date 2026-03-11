import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { RelancesService } from './relances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@totem/database';

@ApiTags('emails')
@ApiBearerAuth()
@Controller('emails')
export class EmailsController {
  constructor(
    private emails: EmailsService,
    private relances: RelancesService,
  ) {}

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  templates() {
    return this.emails.getTemplates();
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  send(
    @Body() body: { to: string; subject: string; html: string },
    @CurrentUser() user: any,
  ) {
    return this.emails.send({
      ...body,
      sentById: user.id,
    });
  }

  @Post('run-relances')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  runRelances() {
    return this.relances.runRelances();
  }
}
