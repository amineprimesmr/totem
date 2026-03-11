import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from './emails.service';

const DAYS_CANDIDAT_RELANCE = 7;
const DAYS_MATCH_RELANCE = 5;

@Injectable()
export class RelancesService {
  constructor(
    private prisma: PrismaService,
    private emails: EmailsService,
  ) {}

  async runRelances() {
    const results = { candidats: 0, matches: 0, errors: [] as string[] };

    const sinceCandidat = new Date();
    sinceCandidat.setDate(sinceCandidat.getDate() - DAYS_CANDIDAT_RELANCE);

    const sinceMatch = new Date();
    sinceMatch.setDate(sinceMatch.getDate() - DAYS_MATCH_RELANCE);

    // Candidats en recherche depuis X jours sans nouveau match
    const candidatsToRelance = await this.prisma.candidate.findMany({
      where: {
        status: 'SEARCHING',
        updatedAt: { lte: sinceCandidat },
        matches: { none: {} },
      },
      include: { user: true },
      take: 50,
    });

    for (const c of candidatsToRelance) {
      try {
        const rendered = await this.emails.renderTemplate('RELANCE_CANDIDAT', {
          prenom: c.firstName,
          nom: c.lastName,
        });
        if (rendered) {
          await this.emails.send({
            to: c.user.email,
            subject: rendered.subject,
            html: rendered.body,
            trigger: 'RELANCE_CANDIDAT',
            entityType: 'candidate',
            entityId: c.id,
          });
          results.candidats++;
        }
      } catch (e: any) {
        results.errors.push(`Candidat ${c.id}: ${e.message}`);
      }
    }

    // Matchs proposés il y a X jours non vus par l'entreprise (on relance le commercial)
    const matchesToRelance = await this.prisma.match.findMany({
      where: {
        status: 'PROPOSED',
        proposedAt: { lte: sinceMatch },
      },
      include: {
        candidate: { include: { user: true } },
        offer: { include: { company: true } },
      },
      take: 30,
    });

    for (const m of matchesToRelance) {
      try {
        const commercialId = m.offer.company.assignedToId;
        if (!commercialId) continue;
        const commercial = await this.prisma.user.findUnique({
          where: { id: commercialId },
        });
        if (!commercial) continue;
        const rendered = await this.emails.renderTemplate('RELANCE_MATCH_COMMERCIAL', {
          candidat_nom: `${m.candidate.firstName} ${m.candidate.lastName}`,
          entreprise_nom: m.offer.company.name,
          offre_titre: m.offer.title,
        });
        if (rendered) {
          await this.emails.send({
            to: commercial.email,
            subject: rendered.subject,
            html: rendered.body,
            trigger: 'RELANCE_MATCH_COMMERCIAL',
            entityType: 'match',
            entityId: m.id,
          });
          results.matches++;
        }
      } catch (e: any) {
        results.errors.push(`Match ${m.id}: ${e.message}`);
      }
    }

    return results;
  }
}
