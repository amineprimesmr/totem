import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@totem/database';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private matches: MatchesService) {}

  /** Public: le candidat répond Oui/Non depuis le lien reçu par email (sans auth). */
  @Post('respond-by-token')
  respondByToken(@Body('token') token: string, @Body('response') response: string) {
    if (!token || !response) throw new BadRequestException('token et response requis');
    const normalized = response.toUpperCase() === 'OUI' || response.toUpperCase() === 'YES' ? 'YES' : 'NO';
    return this.matches.respondByToken(token, normalized as 'YES' | 'NO');
  }

  @Post('propose')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.ADMISSION)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.ADMISSION)
  propose(
    @Body('candidateId') candidateId: string,
    @Body('offerId') offerId: string,
    @CurrentUser() user: any,
  ) {
    return this.matches.proposeCandidateToOffer(candidateId, offerId, user.id);
  }

  @Get('candidate/:candidateId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  forCandidate(@Param('candidateId') candidateId: string, @CurrentUser() user: any) {
    if (user.role === UserRole.CANDIDATE && user.candidateId !== candidateId) {
      return Promise.reject({ statusCode: 403, message: 'Forbidden' });
    }
    return this.matches.getMatchesForCandidate(candidateId);
  }

  @Get('offer/:offerId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  forOffer(@Param('offerId') offerId: string) {
    return this.matches.getMatchesForOffer(offerId);
  }

  @Get('suggestions/candidate/:candidateId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  suggestedOffers(@Param('candidateId') candidateId: string, @CurrentUser() user: any) {
    if (user.role === UserRole.CANDIDATE && user.candidateId !== candidateId) {
      return Promise.reject({ statusCode: 403, message: 'Forbidden' });
    }
    return this.matches.getSuggestedOffers(candidateId);
  }

  @Get('suggestions/offer/:offerId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  suggestedCandidates(@Param('offerId') offerId: string) {
    return this.matches.getSuggestedCandidates(offerId);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.matches.updateStatus(id, status as any);
  }
}
