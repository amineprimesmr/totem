import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const DEMO_EMAIL_SUFFIX = '@totem-demo.fr';
const DEMO_COMPANY_PREFIX = '[Démo] ';

@Injectable()
export class DemoService {
  constructor(private prisma: PrismaService) {}

  async loadDemoData(): Promise<{ message: string; created: Record<string, number> }> {
    const created: Record<string, number> = {
      users: 0,
      candidates: 0,
      companies: 0,
      offers: 0,
      matches: 0,
      interviews: 0,
    };

    // Supprimer les anciennes données démo pour pouvoir recharger
    await this.cleanDemoData();

    const hashedDemo = await bcrypt.hash('demo123', 10);

    // 1. Utilisateurs école (commercial, admission)
    const commercial = await this.prisma.user.create({
      data: {
        email: `demo-commercial${DEMO_EMAIL_SUFFIX}`,
        password: hashedDemo,
        name: 'Marie Commercial',
        role: 'COMMERCIAL',
      },
    });
    const admission = await this.prisma.user.create({
      data: {
        email: `demo-admission${DEMO_EMAIL_SUFFIX}`,
        password: hashedDemo,
        name: 'Thomas Admission',
        role: 'ADMISSION',
      },
    });
    created.users += 2;

    // 2. Candidats (user + candidate)
    const candidatesData = [
      {
        firstName: 'Léa',
        lastName: 'Martin',
        formation: 'Bachelor Communication',
        city: 'Rennes',
        postalCode: '35000',
        status: 'SEARCHING' as const,
        sectors: ['Communication', 'Digital'],
        latitude: 48.1113,
        longitude: -1.6742,
      },
      {
        firstName: 'Hugo',
        lastName: 'Bernard',
        formation: 'BTS NDRC',
        city: 'Rennes',
        postalCode: '35700',
        status: 'SEARCHING' as const,
        sectors: ['Commerce', 'Relation client'],
        latitude: 48.1262,
        longitude: -1.6504,
      },
      {
        firstName: 'Chloé',
        lastName: 'Dubois',
        formation: 'Bachelor RH',
        city: 'Rennes',
        postalCode: '35200',
        status: 'IN_PROCESS' as const,
        sectors: ['Ressources humaines'],
        latitude: 48.0967,
        longitude: -1.6721,
      },
      {
        firstName: 'Lucas',
        lastName: 'Petit',
        formation: 'BTS MCO',
        city: 'Rennes',
        postalCode: '35000',
        status: 'SEARCHING' as const,
        sectors: ['Commerce', 'Vente'],
        latitude: 48.1185,
        longitude: -1.6948,
      },
      {
        firstName: 'Emma',
        lastName: 'Leroy',
        formation: 'Mastère Manager d\'Affaires',
        city: 'Rennes',
        postalCode: '35700',
        status: 'REGISTERED' as const,
        sectors: ['Commercial'],
        latitude: 48.1281,
        longitude: -1.6461,
      },
      {
        firstName: 'Nathan',
        lastName: 'Moreau',
        formation: 'BTS GPME',
        city: 'Rennes',
        postalCode: '35200',
        status: 'SIGNED' as const,
        sectors: ['Gestion', 'PME'],
        latitude: 48.1039,
        longitude: -1.6597,
      },
      {
        firstName: 'Sarah',
        lastName: 'Le Goff',
        formation: 'BTS PI',
        city: 'Rennes',
        postalCode: '35000',
        status: 'SEARCHING' as const,
        sectors: ['Immobilier', 'Commerce'],
        latitude: 48.1074,
        longitude: -1.6829,
      },
      {
        firstName: 'Yanis',
        lastName: 'Moulin',
        formation: 'Bachelor RDCM',
        city: 'Cesson-Sévigné',
        postalCode: '35510',
        status: 'SEARCHING' as const,
        sectors: ['Développement commercial', 'Marketing'],
        latitude: 48.1219,
        longitude: -1.6079,
      },
    ];

    const candidateIds: string[] = [];
    for (let i = 0; i < candidatesData.length; i++) {
      const d = candidatesData[i];
      const user = await this.prisma.user.create({
        data: {
          email: `demo-candidat-${i + 1}${DEMO_EMAIL_SUFFIX}`,
          password: hashedDemo,
          name: `${d.firstName} ${d.lastName}`,
          role: 'CANDIDATE',
          candidate: {
            create: {
              firstName: d.firstName,
              lastName: d.lastName,
              formation: d.formation,
              city: d.city,
              postalCode: d.postalCode,
              sectors: d.sectors,
              status: d.status,
              searchRadiusKm: 50,
              contractType: 'APPRENTICESHIP',
              latitude: d.latitude,
              longitude: d.longitude,
              assignedToId: i % 2 === 0 ? admission.id : admission.id,
            },
          },
        },
        include: { candidate: true },
      });
      if (user.candidate) candidateIds.push(user.candidate.id);
      created.users += 1;
      created.candidates += 1;
    }

    // 3. Entreprises
    const companiesData = [
      {
        name: 'Rennes Digital Conseil',
        sector: 'Digital',
        city: 'Rennes',
        address: '18 rue de Nantes',
        postalCode: '35000',
        latitude: 48.1017,
        longitude: -1.6846,
      },
      {
        name: 'Armor Conseil RH',
        sector: 'Ressources humaines',
        city: 'Rennes',
        address: '21 boulevard de la Liberté',
        postalCode: '35000',
        latitude: 48.1068,
        longitude: -1.6841,
      },
      {
        name: 'Rennes Retail & Mode',
        sector: 'Commerce',
        city: 'Rennes',
        address: '3 rue Le Bastard',
        postalCode: '35000',
        latitude: 48.1119,
        longitude: -1.6791,
      },
      {
        name: 'Bretagne Finance & Audit',
        sector: 'Finance',
        city: 'Rennes',
        address: '3 quai Lamennais',
        postalCode: '35000',
        latitude: 48.1098,
        longitude: -1.6794,
      },
      {
        name: 'Immo Ouest Alternance',
        sector: 'Immobilier',
        city: 'Rennes',
        address: '12 avenue Janvier',
        postalCode: '35000',
        latitude: 48.1054,
        longitude: -1.6729,
      },
      {
        name: 'Tech Cesson Campus',
        sector: 'Digital',
        city: 'Cesson-Sévigné',
        address: '4 rue du Chêne Germain',
        postalCode: '35510',
        latitude: 48.1226,
        longitude: -1.6243,
      },
    ];

    const companyIds: string[] = [];
    for (const c of companiesData) {
      const company = await this.prisma.company.create({
        data: {
          name: DEMO_COMPANY_PREFIX + c.name,
          sector: c.sector,
          address: c.address,
          city: c.city,
          postalCode: c.postalCode,
          latitude: c.latitude,
          longitude: c.longitude,
          status: 'PARTNER',
          assignedToId: commercial.id,
        },
      });
      companyIds.push(company.id);
      created.companies += 1;
    }

    // 4. Offres
    const offersData = [
      { companyIndex: 0, title: 'Alternant Marketing Digital', formation: 'Bachelor Communication', sector: 'Digital', city: 'Rennes' },
      { companyIndex: 0, title: 'Alternant Content & Community Manager', formation: 'Bachelor Communication', sector: 'Digital', city: 'Rennes' },
      { companyIndex: 1, title: 'Alternant Chargé de recrutement', formation: 'Bachelor RH', sector: 'Ressources humaines', city: 'Rennes' },
      { companyIndex: 3, title: 'Alternant Contrôle de gestion', formation: 'BTS GPME', sector: 'Finance', city: 'Rennes' },
      { companyIndex: 2, title: 'Alternant Conseiller clientèle', formation: 'BTS NDRC', sector: 'Commerce', city: 'Rennes' },
      { companyIndex: 4, title: 'Alternant Assistant transaction', formation: 'BTS PI', sector: 'Immobilier', city: 'Rennes' },
      { companyIndex: 5, title: 'Alternant Développeur web', formation: 'Bachelor RDCM', sector: 'Digital', city: 'Cesson-Sévigné' },
    ];

    const offerIds: string[] = [];
    for (const o of offersData) {
      const offer = await this.prisma.offer.create({
        data: {
          companyId: companyIds[o.companyIndex],
          title: o.title,
          description: `Description de l'offre ${o.title}. Mission passionnante en alternance.`,
          location: o.city,
          city: o.city,
          sector: o.sector,
          jobTitle: o.title,
          formation: o.formation,
          contractType: 'APPRENTICESHIP',
          status: 'ACTIVE',
        },
      });
      offerIds.push(offer.id);
      created.offers += 1;
    }

    // 5. Matchs (candidat ↔ offre)
    const matchPairs = [
      [0, 0], [0, 1], [1, 2], [2, 0], [2, 2], [3, 4], [4, 0], [5, 2],
    ];
    const matchIds: string[] = [];
    for (const [cIdx, oIdx] of matchPairs) {
      if (cIdx >= candidateIds.length || oIdx >= offerIds.length) continue;
      const match = await this.prisma.match.create({
        data: {
          candidateId: candidateIds[cIdx],
          offerId: offerIds[oIdx],
          score: 60 + Math.floor(Math.random() * 35),
          distanceKm: 5 + Math.floor(Math.random() * 30),
          status: cIdx % 3 === 0 ? 'PROPOSED' : cIdx % 3 === 1 ? 'VIEWED' : 'INTERVIEW_SCHEDULED',
          proposedAt: new Date(),
          proposedById: admission.id,
        },
      });
      matchIds.push(match.id);
      created.matches += 1;
    }

    // 6. Quelques entretiens
    if (matchIds.length >= 2) {
      await this.prisma.interview.create({
        data: {
          matchId: matchIds[1],
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          time: '14h00',
          location: 'Visio',
          meetingUrl: 'https://meet.example.com/entretien-1',
          status: 'scheduled',
        },
      });
      created.interviews += 1;
    }
    if (matchIds.length >= 3) {
      await this.prisma.interview.create({
        data: {
          matchId: matchIds[2],
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          time: '10h00',
          location: 'Sur site',
          status: 'scheduled',
        },
      });
      created.interviews += 1;
    }

    return {
      message: 'Données d’exemple chargées. Rafraîchissez la page pour voir le tableau de bord.',
      created,
    };
  }

  private async cleanDemoData(): Promise<void> {
    const demoUsers = await this.prisma.user.findMany({
      where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
      include: { candidate: { select: { id: true } } },
    });
    const candidateIds = demoUsers.map((u) => u.candidate?.id).filter(Boolean) as string[];
    if (candidateIds.length > 0) {
      await this.prisma.interview.deleteMany({
        where: { match: { candidateId: { in: candidateIds } } },
      });
      await this.prisma.match.deleteMany({ where: { candidateId: { in: candidateIds } } });
    }
    if (demoUsers.length > 0) {
      await this.prisma.user.deleteMany({
        where: { id: { in: demoUsers.map((u) => u.id) } },
      });
    }

    const demoCompanies = await this.prisma.company.findMany({
      where: { name: { startsWith: DEMO_COMPANY_PREFIX } },
      select: { id: true },
    });
    const companyIds = demoCompanies.map((c) => c.id);
    if (companyIds.length > 0) {
      const offers = await this.prisma.offer.findMany({
        where: { companyId: { in: companyIds } },
        select: { id: true },
      });
      const offerIds = offers.map((o) => o.id);
      if (offerIds.length > 0) {
        await this.prisma.interview.deleteMany({
          where: { match: { offerId: { in: offerIds } } },
        });
        await this.prisma.match.deleteMany({ where: { offerId: { in: offerIds } } });
      }
      await this.prisma.offer.deleteMany({ where: { companyId: { in: companyIds } } });
      await this.prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  }
}
