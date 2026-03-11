import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@totem/database';

@ApiTags('interviews')
@ApiBearerAuth()
@Controller('interviews')
export class InterviewsController {
  constructor(private interviews: InterviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() body: { matchId: string; date: string; time?: string; location?: string; meetingUrl?: string; notes?: string },
  ) {
    return this.interviews.create({
      ...body,
      date: new Date(body.date),
    });
  }

  @Get('match/:matchId')
  @UseGuards(JwtAuthGuard)
  byMatch(@Param('matchId') matchId: string) {
    return this.interviews.findByMatch(matchId);
  }

  @Get('candidate/:candidateId')
  @UseGuards(JwtAuthGuard)
  byCandidate(@Param('candidateId') candidateId: string, @CurrentUser() user: any) {
    if (user.role === UserRole.CANDIDATE && user.candidateId !== candidateId) {
      return Promise.reject({ statusCode: 403, message: 'Forbidden' });
    }
    return this.interviews.findByCandidate(candidateId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.interviews.update(id, {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    });
  }
}
