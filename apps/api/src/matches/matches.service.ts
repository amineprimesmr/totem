import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus } from '@totem/database';
import { MatchingService } from './matching.service';
import { EmailsService } from '../emails/emails.service';
import { randomBytes } from 'crypto';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private matching: MatchingService,
    private emails: EmailsService,
  ) {}

  async proposeCandidateToOffer(candidateId: string, offerId: string, proposedById: string) {
    const [candidate, offer] = await Promise.all([
      this.prisma.candidate.findUnique({ where: { id: candidateId } }),
      this.prisma.offer.findUnique({ where: { id: offerId } }),
    ]);
    if (!candidate) throw new NotFoundException('Candidat non trouvé');
    if (!offer) throw new NotFoundException('Offre non trouvée');

    const computed = await this.matching.computeMatchesForOffer(offerId);
    const matchInfo = computed.find((m) => m.candidateId === candidateId);
    const score = matchInfo?.score ?? 50;
    const distanceKm = matchInfo?.distanceKm ?? null;

    const existing = await this.prisma.match.findUnique({
      where: {
        candidateId_offerId: { candidateId, offerId },
      },
    });
    if (existing) throw new ConflictException('Ce match existe déjà');

    const responseToken = randomBytes(24).toString('hex');
    const match = await this.prisma.match.create({
      data: {
        candidateId,
        offerId,
        score,
        distanceKm,
        status: 'PROPOSED',
        proposedAt: new Date(),
        proposedById,
        responseToken,
      },
      include: {
        candidate: { include: { user: true } },
        offer: { include: { company: true } },
      },
    });

    // Envoi email au candidat : "Cette offre vous correspond, voulez-vous postuler ?" avec liens Oui/Non
    const baseUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const lienOui = `${baseUrl}/reponse-match?token=${responseToken}&reponse=oui`;
    const lienNon = `${baseUrl}/reponse-match?token=${responseToken}&reponse=non`;
    try {
      await this.emails.sendTemplate(
        'MATCH_PROPOSE_CANDIDAT',
        match.candidate.user.email,
        {
          prenom: match.candidate.firstName,
          entreprise_nom: match.offer.company.name,
          offre_titre: match.offer.title,
          lien_oui: lienOui,
          lien_non: lienNon,
        },
        { trigger: 'MATCH_PROPOSE_CANDIDAT', entityType: 'match', entityId: match.id },
      );
      await this.prisma.match.update({
        where: { id: match.id },
        data: { candidateNotifiedAt: new Date() },
      });
    } catch (e) {
      console.warn('[Matches] Email MATCH_PROPOSE_CANDIDAT failed:', e);
    }

    return match;
  }

  async respondByToken(token: string, response: 'YES' | 'NO') {
    const match = await this.prisma.match.findFirst({
      where: { responseToken: token },
      include: {
        candidate: { include: { user: true } },
        offer: { include: { company: true } },
      },
    });
    if (!match) throw new BadRequestException('Lien invalide ou déjà utilisé');
    await this.prisma.match.update({
      where: { id: match.id },
      data: {
        candidateResponse: response,
        candidateRespondedAt: new Date(),
        responseToken: null, // lien à usage unique
      },
    });

    const campaignItem = await this.prisma.messageCampaignItem.findUnique({
      where: { responseToken: token },
      select: { id: true, campaignId: true },
    });
    if (campaignItem) {
      await this.prisma.messageCampaignItem.update({
        where: { id: campaignItem.id },
        data: {
          status: response === 'YES' ? 'YES' : 'NO',
          clickedAt: new Date(),
          respondedAt: new Date(),
          responseToken: null,
        },
      });
      await this.refreshCampaignCounters(campaignItem.campaignId);
    }
    return { ok: true, response };
  }

  async getMatchesForCandidate(candidateId: string) {
    return this.prisma.match.findMany({
      where: { candidateId },
      include: {
        offer: { include: { company: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMatchesForOffer(offerId: string) {
    return this.prisma.match.findMany({
      where: { offerId },
      include: {
        candidate: { include: { user: true } },
      },
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async updateStatus(
    matchId: string,
    status: MatchStatus,
  ) {
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status },
      include: {
        candidate: { include: { user: true } },
        offer: { include: { company: true } },
      },
    });
  }

  async getSuggestedCandidates(offerId: string) {
    return this.matching.computeMatchesForOffer(offerId);
  }

  async getSuggestedOffers(candidateId: string) {
    return this.matching.computeMatchesForCandidate(candidateId);
  }

  private async refreshCampaignCounters(campaignId: string) {
    const grouped = await this.prisma.messageCampaignItem.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { _all: true },
    });
    const count = (status: string) =>
      grouped.find((g) => g.status === status)?._count._all ?? 0;
    await this.prisma.messageCampaign.update({
      where: { id: campaignId },
      data: {
        itemCount: grouped.reduce((acc, g) => acc + g._count._all, 0),
        sentCount: count('SENT'),
        yesCount: count('YES'),
        noCount: count('NO'),
        errorCount: count('ERROR'),
      },
    });
  }
}
