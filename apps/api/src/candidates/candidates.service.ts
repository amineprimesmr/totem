import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CandidateStatus } from '@totem/database';
import { QualificationService } from './qualification.service';
import { LocationService } from '../location/location.service';

@Injectable()
export class CandidatesService {
  constructor(
    private prisma: PrismaService,
    private qualification: QualificationService,
    private location: LocationService,
  ) {}

  async create(data: {
    userId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    formation: string;
    level?: string;
    city: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    searchRadiusKm?: number;
    sectors?: string[];
    desiredJob?: string[];
    contractType?: any;
    availableFrom?: Date;
    cvPath?: string;
    coverLetterPath?: string;
    assignedToId?: string;
  }) {
    const hasCoordinates = data.latitude != null && data.longitude != null;
    const geocoded = hasCoordinates
      ? null
      : await this.location.geocodeCandidate({
          city: data.city,
          postalCode: data.postalCode,
        });

    return this.prisma.candidate.create({
      data: {
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        formation: data.formation,
        level: data.level,
        city: data.city,
        postalCode: data.postalCode,
        latitude: data.latitude ?? geocoded?.latitude,
        longitude: data.longitude ?? geocoded?.longitude,
        searchRadiusKm: data.searchRadiusKm ?? 50,
        sectors: data.sectors ?? [],
        desiredJob: data.desiredJob ?? [],
        contractType: data.contractType ?? 'APPRENTICESHIP',
        availableFrom: data.availableFrom,
        cvPath: data.cvPath,
        coverLetterPath: data.coverLetterPath,
        assignedToId: data.assignedToId,
      },
      include: { user: true, assignedTo: true },
    });
  }

  async findAll(filters?: {
    status?: CandidateStatus;
    formation?: string;
    assignedToId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.formation) where.formation = filters.formation;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    const list = await this.prisma.candidate.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: ((filters?.page ?? 1) - 1) * (filters?.pageSize ?? 25),
      take: filters?.pageSize ?? 25,
    });
    return list.map((c) => {
      const q = this.qualification.computeQuick(c);
      return { ...c, qualificationScore: q.score, qualificationLevel: q.level };
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        matches: {
          include: {
            offer: { include: { company: true } },
            interviews: { orderBy: { date: 'desc' } },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
    if (!c) throw new NotFoundException('Candidat non trouvé');
    const qualification = this.qualification.computeQualification(c);
    const interviews = c.matches.flatMap((m) =>
      (m.interviews || []).map((i) => ({
        ...i,
        match: {
          id: m.id,
          candidateId: m.candidateId,
          offerId: m.offerId,
          score: m.score,
          status: m.status,
          offer: m.offer,
        },
      })),
    );
    interviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const matches = c.matches.map((m) => {
      const { candidate: _c, ...rest } = m as any;
      return rest;
    });
    return {
      ...c,
      matches,
      interviews,
      qualificationScore: qualification.score,
      qualificationLevel: qualification.level,
      qualificationCriteria: qualification.criteria,
      qualificationSummary: qualification.summary,
    };
  }

  async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      formation: string;
      level: string;
      city: string;
      postalCode: string;
      latitude: number;
      longitude: number;
      searchRadiusKm: number;
      sectors: string[];
      desiredJob: string[];
      contractType: any;
      availableFrom: Date;
      cvPath: string;
      coverLetterPath: string;
      status: CandidateStatus;
      assignedToId: string | null;
    }>,
  ) {
    const current = await this.prisma.candidate.findUnique({
      where: { id },
      select: { city: true, postalCode: true, latitude: true, longitude: true },
    });
    const shouldTryGeocode =
      data.latitude == null &&
      data.longitude == null &&
      (data.city != null || data.postalCode != null || current?.latitude == null || current?.longitude == null);

    let geocoded: { latitude: number; longitude: number } | null = null;
    if (shouldTryGeocode) {
      geocoded = await this.location.geocodeCandidate({
        city: data.city ?? current?.city,
        postalCode: data.postalCode ?? current?.postalCode,
      });
    }

    const payload: any = { ...data };
    if (geocoded && payload.latitude == null && payload.longitude == null) {
      payload.latitude = geocoded.latitude;
      payload.longitude = geocoded.longitude;
    }

    return this.prisma.candidate.update({
      where: { id },
      data: payload,
      include: { user: true, assignedTo: true },
    });
  }

  async assignTo(candidateId: string, userId: string) {
    return this.update(candidateId, { assignedToId: userId });
  }

  async exportCsv(filters?: Parameters<CandidatesService['findAll']>[0]) {
    const rows = await this.findAll(filters);
    const headers = ['Nom', 'Prénom', 'Email', 'Formation', 'Ville', 'Statut', 'Nb matchs', 'Assigné à'];
    const escape = (v: string | number | null | undefined) =>
      v == null ? '' : String(v).replace(/"/g, '""');
    const line = (arr: (string | number | null | undefined)[]) =>
      arr.map((c) => `"${escape(c)}"`).join(',');
    const lines = [
      line(headers),
      ...rows.map((c) =>
        line([
          c.lastName,
          c.firstName,
          (c.user as any)?.email,
          c.formation,
          c.city,
          c.status,
          (c as any)._count?.matches ?? 0,
          (c.assignedTo as any)?.name ?? (c.assignedTo as any)?.email ?? '',
        ]),
      ),
    ];
    return '\uFEFF' + lines.join('\r\n'); // BOM for Excel UTF-8
  }
}
