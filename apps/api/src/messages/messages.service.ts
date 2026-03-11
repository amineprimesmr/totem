import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { randomBytes } from 'crypto';
import twilio, { Twilio } from 'twilio';

type CampaignDirection = 'CANDIDATE_TO_COMPANIES' | 'COMPANY_TO_CANDIDATES';
type CampaignChannel = 'EMAIL' | 'SMS';

type PreviewItem = {
  candidateId: string;
  offerId: string;
  companyId: string;
  score: number;
  distanceKm: number | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  label: string;
};

const MAX_BATCH_SIZE = 200;

@Injectable()
export class MessagesService {
  private twilioClient: Twilio | null = null;

  constructor(
    private prisma: PrismaService,
    private emails: EmailsService,
  ) {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    }
  }

  async previewCampaign(input: {
    direction: CampaignDirection;
    selectedEntityId: string;
    maxItems?: number;
  }) {
    const maxItems = this.normalizeMaxItems(input.maxItems);
    const items = await this.resolvePreviewItems(
      input.direction,
      input.selectedEntityId,
      maxItems,
    );
    return {
      direction: input.direction,
      selectedEntityId: input.selectedEntityId,
      total: items.length,
      items,
    };
  }

  async sendCampaign(
    input: {
      direction: CampaignDirection;
      channel?: CampaignChannel;
      selectedEntityId: string;
      maxItems?: number;
      name?: string;
    },
    createdById: string,
  ) {
    await this.ensureCampaignTemplates();
    const maxItems = this.normalizeMaxItems(input.maxItems);
    const channel: CampaignChannel = input.channel ?? 'EMAIL';
    const previewItems = await this.resolvePreviewItems(
      input.direction,
      input.selectedEntityId,
      maxItems,
    );

    const campaign = await this.prisma.messageCampaign.create({
      data: {
        name:
          input.name?.trim() ||
          `${input.direction === 'CANDIDATE_TO_COMPANIES' ? 'Campagne candidat' : 'Campagne entreprise'} ${new Date().toISOString()}`,
        direction: input.direction,
        channel,
        selectedEntityId: input.selectedEntityId,
        createdById,
        itemCount: previewItems.length,
      },
    });

    let sentCount = 0;
    let errorCount = 0;

    for (const item of previewItems) {
      const token = randomBytes(24).toString('hex');
      const match = await this.upsertMatch(item.candidateId, item.offerId, createdById, token);

      const baseUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3003';
      const lienOui = `${baseUrl}/reponse-match?token=${token}&reponse=oui`;
      const lienNon = `${baseUrl}/reponse-match?token=${token}&reponse=non`;

      try {
        const vars = await this.buildTemplateVars(item, lienOui, lienNon);
        const smsBody = this.renderSmsBody(vars);

        let usedChannel: CampaignChannel = channel;
        let providerMessageSid: string | undefined;
        let providerStatus: string | undefined;

        if (channel === 'SMS') {
          const normalizedPhone = this.normalizePhone(item.recipientPhone);
          if (normalizedPhone && this.twilioClient && process.env.TWILIO_FROM_NUMBER) {
            const twilioResponse = await this.twilioClient.messages.create({
              from: process.env.TWILIO_FROM_NUMBER,
              to: normalizedPhone,
              body: smsBody,
              statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
            });
            providerMessageSid = twilioResponse.sid;
            providerStatus = twilioResponse.status ?? 'queued';
          } else if (item.recipientEmail) {
            usedChannel = 'EMAIL';
            await this.emails.sendTemplate(
              input.direction === 'CANDIDATE_TO_COMPANIES'
                ? 'MATCH_CAMPAIGN_CANDIDATE'
                : 'MATCH_CAMPAIGN_COMPANY',
              item.recipientEmail,
              vars,
              {
                trigger: 'MATCH_CAMPAIGN',
                entityType: 'campaign',
                entityId: campaign.id,
                sentById: createdById,
              },
            );
          } else {
            throw new Error('Aucun destinataire SMS/email disponible');
          }
        } else {
          if (!item.recipientEmail) throw new Error('Email destinataire introuvable');
          await this.emails.sendTemplate(
            input.direction === 'CANDIDATE_TO_COMPANIES'
              ? 'MATCH_CAMPAIGN_CANDIDATE'
              : 'MATCH_CAMPAIGN_COMPANY',
            item.recipientEmail,
            vars,
            {
              trigger: 'MATCH_CAMPAIGN',
              entityType: 'campaign',
              entityId: campaign.id,
              sentById: createdById,
            },
          );
        }

        this.logCampaignEvent('send_success', {
          campaignId: campaign.id,
          candidateId: item.candidateId,
          offerId: item.offerId,
          companyId: item.companyId,
          channel: usedChannel,
          providerStatus: providerStatus ?? 'sent',
        });

        await this.prisma.messageCampaignItem.upsert({
          where: {
            campaignId_candidateId_offerId: {
              campaignId: campaign.id,
              candidateId: item.candidateId,
              offerId: item.offerId,
            },
          },
          update: {
            status: 'SENT',
            channel: usedChannel,
            recipientEmail: item.recipientEmail ?? undefined,
            recipientPhone: item.recipientPhone ?? undefined,
            providerMessageSid,
            providerStatus,
            score: item.score,
            distanceKm: item.distanceKm ?? undefined,
            responseToken: token,
            sentAt: new Date(),
            errorMessage: null,
            matchId: match.id,
          },
          create: {
            campaignId: campaign.id,
            candidateId: item.candidateId,
            companyId: item.companyId,
            offerId: item.offerId,
            matchId: match.id,
            status: 'SENT',
            channel: usedChannel,
            recipientEmail: item.recipientEmail ?? undefined,
            recipientPhone: item.recipientPhone ?? undefined,
            providerMessageSid,
            providerStatus,
            score: item.score,
            distanceKm: item.distanceKm ?? undefined,
            responseToken: token,
            sentAt: new Date(),
          },
        });
        sentCount += 1;
      } catch (e) {
        this.logCampaignEvent('send_error', {
          campaignId: campaign.id,
          candidateId: item.candidateId,
          offerId: item.offerId,
          companyId: item.companyId,
          channel,
          error: e instanceof Error ? e.message : 'Erreur envoi',
        });
        await this.prisma.messageCampaignItem.upsert({
          where: {
            campaignId_candidateId_offerId: {
              campaignId: campaign.id,
              candidateId: item.candidateId,
              offerId: item.offerId,
            },
          },
          update: {
            status: 'ERROR',
            channel,
            recipientEmail: item.recipientEmail ?? undefined,
            recipientPhone: item.recipientPhone ?? undefined,
            score: item.score,
            distanceKm: item.distanceKm ?? undefined,
            responseToken: token,
            errorMessage: e instanceof Error ? e.message : 'Erreur envoi',
            matchId: match.id,
          },
          create: {
            campaignId: campaign.id,
            candidateId: item.candidateId,
            companyId: item.companyId,
            offerId: item.offerId,
            matchId: match.id,
            status: 'ERROR',
            channel,
            recipientEmail: item.recipientEmail ?? undefined,
            recipientPhone: item.recipientPhone ?? undefined,
            score: item.score,
            distanceKm: item.distanceKm ?? undefined,
            responseToken: token,
            errorMessage: e instanceof Error ? e.message : 'Erreur envoi',
          },
        });
        errorCount += 1;
      }
      await this.sleep(channel === 'SMS' ? 120 : 25);
    }

    await this.refreshCampaignCounters(campaign.id, { sentCount, errorCount });
    return this.getCampaign(campaign.id);
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.messageCampaign.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            candidate: { select: { firstName: true, lastName: true } },
            company: { select: { name: true } },
            offer: { select: { title: true } },
            match: { select: { status: true, candidateResponse: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!campaign) throw new NotFoundException('Campagne introuvable');
    return campaign;
  }

  async retryFailed(campaignId: string, sentById: string) {
    const campaign = await this.prisma.messageCampaign.findUnique({
      where: { id: campaignId },
      include: {
        items: {
          where: { status: 'ERROR' },
          select: {
            candidateId: true,
            offerId: true,
            companyId: true,
            responseToken: true,
          },
        },
      },
    });
    if (!campaign) throw new NotFoundException('Campagne introuvable');
    if (campaign.items.length === 0) return this.getCampaign(campaignId);

    for (const item of campaign.items) {
      if (!item.candidateId || !item.offerId) continue;
      const token = item.responseToken ?? randomBytes(24).toString('hex');
      const match = await this.upsertMatch(item.candidateId, item.offerId, sentById, token);
      const recipient = await this.resolveRecipientEmail(
        campaign.direction as CampaignDirection,
        item.candidateId,
        item.companyId ?? undefined,
      );
      const phone = await this.resolveRecipientPhone(
        campaign.direction as CampaignDirection,
        item.candidateId,
        item.companyId ?? undefined,
      );

      const baseUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3003';
      const lienOui = `${baseUrl}/reponse-match?token=${token}&reponse=oui`;
      const lienNon = `${baseUrl}/reponse-match?token=${token}&reponse=non`;

      const previewLabel = await this.resolveItemLabel(item.candidateId, item.offerId, item.companyId ?? undefined);
      const previewItem: PreviewItem = {
        candidateId: item.candidateId,
        offerId: item.offerId,
        companyId: item.companyId ?? '',
        score: 0,
        distanceKm: null,
        recipientEmail: recipient,
        recipientPhone: phone,
        label: previewLabel,
      };
      const vars = await this.buildTemplateVars(previewItem, lienOui, lienNon);
      if (campaign.channel === 'SMS' && this.twilioClient && process.env.TWILIO_FROM_NUMBER) {
        const normalizedPhone = this.normalizePhone(phone);
        if (normalizedPhone) {
          await this.twilioClient.messages.create({
            from: process.env.TWILIO_FROM_NUMBER,
            to: normalizedPhone,
            body: this.renderSmsBody(vars),
            statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
          });
        } else if (recipient) {
          await this.emails.sendTemplate(
            campaign.direction === 'CANDIDATE_TO_COMPANIES'
              ? 'MATCH_CAMPAIGN_CANDIDATE'
              : 'MATCH_CAMPAIGN_COMPANY',
            recipient,
            vars,
            { trigger: 'MATCH_CAMPAIGN_RETRY', entityType: 'campaign', entityId: campaignId, sentById },
          );
        } else {
          continue;
        }
      } else {
        if (!recipient) continue;
        await this.emails.sendTemplate(
          campaign.direction === 'CANDIDATE_TO_COMPANIES'
            ? 'MATCH_CAMPAIGN_CANDIDATE'
            : 'MATCH_CAMPAIGN_COMPANY',
          recipient,
          vars,
          { trigger: 'MATCH_CAMPAIGN_RETRY', entityType: 'campaign', entityId: campaignId, sentById },
        );
      }
      await this.prisma.messageCampaignItem.updateMany({
        where: { campaignId, candidateId: item.candidateId, offerId: item.offerId, status: 'ERROR' },
        data: { status: 'SENT', sentAt: new Date(), errorMessage: null, matchId: match.id },
      });
    }

    await this.refreshCampaignCounters(campaignId);
    return this.getCampaign(campaignId);
  }

  private async resolvePreviewItems(
    direction: CampaignDirection,
    selectedEntityId: string,
    maxItems: number,
  ): Promise<PreviewItem[]> {
    if (direction === 'CANDIDATE_TO_COMPANIES') {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: selectedEntityId },
        include: { user: true },
      });
      if (!candidate) throw new NotFoundException('Candidat introuvable');

      const suggestions = await this.computeSuggestedOffersForCandidate(selectedEntityId, maxItems);
      const offers = await this.prisma.offer.findMany({
        where: { id: { in: suggestions.map((s) => s.offerId) } },
        include: { company: true },
      });
      const offerMap = new Map(offers.map((o) => [o.id, o]));
      return suggestions.map((s) => {
        const offer = offerMap.get(s.offerId);
        return {
          candidateId: selectedEntityId,
          offerId: s.offerId,
          companyId: offer?.companyId ?? '',
          score: s.score,
          distanceKm: s.distanceKm,
          recipientEmail: candidate.user.email,
          recipientPhone: candidate.phone ?? null,
          label: `${candidate.firstName} ${candidate.lastName} -> ${offer?.company.name ?? 'Entreprise'}`,
        };
      });
    }

    const company = await this.prisma.company.findUnique({
      where: { id: selectedEntityId },
      include: { contactUser: true, offers: { where: { status: 'ACTIVE' } } },
    });
    if (!company) throw new NotFoundException('Entreprise introuvable');
    if (company.offers.length === 0) return [];

    const suggestionsByCandidate = new Map<
      string,
      { offerId: string; score: number; distanceKm: number | null }
    >();
    for (const offer of company.offers) {
      const suggestions = await this.computeSuggestedCandidatesForOffer(offer.id, maxItems);
      for (const s of suggestions) {
        const existing = suggestionsByCandidate.get(s.candidateId);
        if (!existing || s.score > existing.score) {
          suggestionsByCandidate.set(s.candidateId, {
            offerId: offer.id,
            score: s.score,
            distanceKm: s.distanceKm,
          });
        }
      }
    }
    const best = Array.from(suggestionsByCandidate.entries())
      .map(([candidateId, info]) => ({ candidateId, ...info }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);
    const candidates = await this.prisma.candidate.findMany({
      where: { id: { in: best.map((b) => b.candidateId) } },
    });
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    return best.map((b) => ({
      candidateId: b.candidateId,
      offerId: b.offerId,
      companyId: selectedEntityId,
      score: b.score,
      distanceKm: b.distanceKm,
      recipientEmail: company.contactUser?.email ?? null,
      recipientPhone: company.phone ?? null,
      label: `${company.name} <- ${candidateMap.get(b.candidateId)?.firstName ?? 'Candidat'} ${candidateMap.get(b.candidateId)?.lastName ?? ''}`.trim(),
    }));
  }

  private async computeSuggestedOffersForCandidate(candidateId: string, maxItems: number) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return [];
    const offers = await this.prisma.offer.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, formation: true, sector: true, contractType: true, latitude: true, longitude: true },
    });
    const radius = candidate.searchRadiusKm ?? 50;
    const scored = offers.map((offer) => {
      let score = 30;
      let distanceKm: number | null = null;
      if (
        candidate.latitude != null &&
        candidate.longitude != null &&
        offer.latitude != null &&
        offer.longitude != null
      ) {
        distanceKm = this.distanceKm(
          candidate.latitude,
          candidate.longitude,
          offer.latitude,
          offer.longitude,
        );
        score += distanceKm <= radius ? 30 : distanceKm <= radius * 1.5 ? 15 : 0;
      }
      if (candidate.formation.toLowerCase() === offer.formation.toLowerCase()) score += 25;
      if (candidate.sectors.some((s) => s.toLowerCase() === offer.sector.toLowerCase())) score += 10;
      if (candidate.contractType === offer.contractType) score += 5;
      return { offerId: offer.id, score: Math.min(100, score), distanceKm };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, maxItems);
  }

  private async computeSuggestedCandidatesForOffer(offerId: string, maxItems: number) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) return [];
    const candidates = await this.prisma.candidate.findMany({
      where: { status: 'SEARCHING' },
      select: {
        id: true,
        formation: true,
        sectors: true,
        contractType: true,
        latitude: true,
        longitude: true,
        searchRadiusKm: true,
      },
    });
    const scored = candidates.map((c) => {
      let score = 30;
      let distanceKm: number | null = null;
      if (
        c.latitude != null &&
        c.longitude != null &&
        offer.latitude != null &&
        offer.longitude != null
      ) {
        distanceKm = this.distanceKm(c.latitude, c.longitude, offer.latitude, offer.longitude);
        const radius = c.searchRadiusKm ?? 50;
        score += distanceKm <= radius ? 30 : distanceKm <= radius * 1.5 ? 15 : 0;
      }
      if (c.formation.toLowerCase() === offer.formation.toLowerCase()) score += 25;
      if (c.sectors.some((s) => s.toLowerCase() === offer.sector.toLowerCase())) score += 10;
      if (c.contractType === offer.contractType) score += 5;
      return { candidateId: c.id, score: Math.min(100, score), distanceKm };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, maxItems);
  }

  private normalizeMaxItems(value?: number) {
    const n = Number(value ?? 30);
    if (!Number.isFinite(n) || n < 1) return 30;
    if (n > MAX_BATCH_SIZE) throw new BadRequestException(`Batch max ${MAX_BATCH_SIZE}`);
    return n;
  }

  async applyTwilioStatus(
    messageSid: string,
    messageStatus: string,
    errorMessage?: string,
  ) {
    const item = await this.prisma.messageCampaignItem.findUnique({
      where: { providerMessageSid: messageSid },
      select: { id: true, campaignId: true, status: true },
    });
    if (!item) return { ok: true, ignored: true };

    const lowered = messageStatus.toLowerCase();
    const isDelivered = lowered === 'delivered';
    const isFailed = lowered === 'undelivered' || lowered === 'failed';
    const nextStatus = isFailed
      ? 'ERROR'
      : isDelivered && item.status === 'SENT'
        ? 'SENT'
        : item.status;

    await this.prisma.messageCampaignItem.update({
      where: { id: item.id },
      data: {
        providerStatus: messageStatus,
        deliveredAt: isDelivered ? new Date() : undefined,
        status: nextStatus,
        errorMessage: isFailed ? errorMessage ?? 'Twilio delivery failed' : undefined,
      },
    });
    await this.refreshCampaignCounters(item.campaignId);
    this.logCampaignEvent('twilio_status', {
      campaignId: item.campaignId,
      messageSid,
      messageStatus,
      mappedStatus: nextStatus,
    });
    return { ok: true };
  }

  private async resolveRecipientEmail(
    direction: CampaignDirection,
    candidateId: string,
    companyId?: string,
  ) {
    if (direction === 'CANDIDATE_TO_COMPANIES') {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { user: true },
      });
      return candidate?.user?.email ?? null;
    }
    if (!companyId) return null;
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { contactUser: true },
    });
    return company?.contactUser?.email ?? null;
  }

  private async resolveRecipientPhone(
    direction: CampaignDirection,
    candidateId: string,
    companyId?: string,
  ) {
    if (direction === 'CANDIDATE_TO_COMPANIES') {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { phone: true },
      });
      return candidate?.phone ?? null;
    }
    if (!companyId) return null;
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { phone: true },
    });
    return company?.phone ?? null;
  }

  private async resolveItemLabel(candidateId: string, offerId: string, companyId?: string) {
    const [candidate, offer, company] = await Promise.all([
      this.prisma.candidate.findUnique({ where: { id: candidateId } }),
      this.prisma.offer.findUnique({ where: { id: offerId } }),
      companyId ? this.prisma.company.findUnique({ where: { id: companyId } }) : Promise.resolve(null),
    ]);
    return `${candidate?.firstName ?? 'Candidat'} ${candidate?.lastName ?? ''} -> ${
      company?.name ?? offer?.title ?? 'Offre'
    }`.trim();
  }

  private async buildTemplateVars(item: PreviewItem, lienOui: string, lienNon: string) {
    const [candidate, offer, company] = await Promise.all([
      this.prisma.candidate.findUnique({ where: { id: item.candidateId } }),
      this.prisma.offer.findUnique({ where: { id: item.offerId } }),
      this.prisma.company.findUnique({ where: { id: item.companyId } }),
    ]);
    return {
      prenom: candidate?.firstName ?? 'Candidat',
      candidat_nom: `${candidate?.firstName ?? ''} ${candidate?.lastName ?? ''}`.trim(),
      entreprise_nom: company?.name ?? 'Entreprise',
      offre_titre: offer?.title ?? 'Offre en alternance',
      score: String(item.score ?? 0),
      distance_km: item.distanceKm == null ? 'n/a' : String(Math.round(item.distanceKm)),
      lien_oui: lienOui,
      lien_non: lienNon,
      lien_plateforme: `${process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3003'}/dashboard/map`,
    };
  }

  private async upsertMatch(
    candidateId: string,
    offerId: string,
    proposedById: string,
    responseToken: string,
  ) {
    const existing = await this.prisma.match.findUnique({
      where: { candidateId_offerId: { candidateId, offerId } },
    });
    if (existing) {
      return this.prisma.match.update({
        where: { id: existing.id },
        data: {
          proposedAt: existing.proposedAt ?? new Date(),
          proposedById: existing.proposedById ?? proposedById,
          responseToken,
          candidateResponse: null,
          candidateRespondedAt: null,
          candidateNotifiedAt: new Date(),
        },
      });
    }
    return this.prisma.match.create({
      data: {
        candidateId,
        offerId,
        score: 60,
        status: 'PROPOSED',
        proposedAt: new Date(),
        proposedById,
        responseToken,
        candidateNotifiedAt: new Date(),
      },
    });
  }

  private async refreshCampaignCounters(
    campaignId: string,
    quick?: { sentCount?: number; errorCount?: number },
  ) {
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
        sentCount: quick?.sentCount ?? count('SENT'),
        yesCount: count('YES'),
        noCount: count('NO'),
        errorCount: quick?.errorCount ?? count('ERROR'),
      },
    });
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  private async ensureCampaignTemplates() {
    const templates = [
      {
        key: 'MATCH_CAMPAIGN_CANDIDATE',
        name: 'Campagne matching vers candidat',
        subject: 'Match alternance : {{offre_titre}} chez {{entreprise_nom}} ({{score}}%)',
        body: '<p>Bonjour {{prenom}},</p><p>Nous pensons que cette offre vous correspond : <strong>{{offre_titre}}</strong> chez <strong>{{entreprise_nom}}</strong>.</p><p>Score estimé: <strong>{{score}}%</strong> — Distance: <strong>{{distance_km}} km</strong>.</p><p style="margin-top:20px;"><a href="{{lien_oui}}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;margin-right:12px;">Oui, je suis intéressé(e)</a> <a href="{{lien_non}}" style="display:inline-block;background:#64748b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Non, merci</a></p>',
      },
      {
        key: 'MATCH_CAMPAIGN_COMPANY',
        name: 'Campagne matching vers entreprise',
        subject: 'Profil proposé : {{candidat_nom}} pour {{offre_titre}} ({{score}}%)',
        body: '<p>Bonjour,</p><p>Nous vous proposons le profil <strong>{{candidat_nom}}</strong> pour l\'offre <strong>{{offre_titre}}</strong>.</p><p>Score estimé: <strong>{{score}}%</strong> — Distance: <strong>{{distance_km}} km</strong>.</p><p style="margin-top:20px;"><a href="{{lien_oui}}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;margin-right:12px;">Oui, intéressé</a> <a href="{{lien_non}}" style="display:inline-block;background:#64748b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Non, merci</a></p>',
      },
      {
        key: 'MATCH_CAMPAIGN_RELANCE',
        name: 'Relance campagne matching',
        subject: 'Relance : retour attendu sur {{offre_titre}}',
        body: '<p>Bonjour,</p><p>Petit rappel concernant la proposition <strong>{{offre_titre}}</strong>.</p><p><a href="{{lien_oui}}">Oui</a> / <a href="{{lien_non}}">Non</a></p>',
      },
    ];
    for (const t of templates) {
      await this.prisma.emailTemplate.upsert({
        where: { key: t.key },
        update: { name: t.name, subject: t.subject, body: t.body, active: true },
        create: t,
      });
    }
  }

  private renderSmsBody(vars: Record<string, string>) {
    return `Totem: ${vars.offre_titre} chez ${vars.entreprise_nom} (${vars.score}%). Oui: ${vars.lien_oui} | Non: ${vars.lien_non}`;
  }

  private logCampaignEvent(event: string, payload: Record<string, unknown>) {
    console.log(
      JSON.stringify({
        level: 'info',
        scope: 'messaging-campaign',
        event,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    );
  }

  private normalizePhone(phone: string | null | undefined) {
    if (!phone) return null;
    const cleaned = phone.replace(/\s+/g, '');
    return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
