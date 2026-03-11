import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@totem/database';
import { SchoolingService } from './schooling.service';

@ApiTags('portail-apprenant')
@ApiBearerAuth()
@Controller('portail/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
export class PortailController {
  constructor(private schooling: SchoolingService) {}

  @Get('schedule')
  mySchedule(
    @CurrentUser() user: { id: string; candidate?: { id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const candidateId = user.candidate?.id;
    if (!candidateId) return [];
    return this.schooling.getMySchedule(candidateId, from, to);
  }

  @Get('absences')
  myAbsences(
    @CurrentUser() user: { id: string; candidate?: { id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const candidateId = user.candidate?.id;
    if (!candidateId) return [];
    return this.schooling.getMyAbsences(candidateId, from, to);
  }

  @Get('grades')
  myGrades(@CurrentUser() user: { id: string; candidate?: { id: string } }) {
    const candidateId = user.candidate?.id;
    if (!candidateId) return [];
    return this.schooling.getMyGrades(candidateId);
  }

  @Get('documents')
  myDocuments(
    @CurrentUser() user: { id: string; candidate?: { id: string } },
    @Query('type') type?: string,
  ) {
    const candidateId = user.candidate?.id;
    if (!candidateId) return [];
    return this.schooling.getMyDocuments(candidateId, type);
  }
}
