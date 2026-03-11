import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus } from '@totem/database';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    companyId: string;
    title: string;
    description: string;
    location: string;
    city: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    sector: string;
    jobTitle: string;
    formation: string;
    contractType?: any;
    startDate?: Date;
    status?: OfferStatus;
  }) {
    return this.prisma.offer.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        location: data.location,
        city: data.city,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        sector: data.sector,
        jobTitle: data.jobTitle,
        formation: data.formation,
        contractType: data.contractType ?? 'APPRENTICESHIP',
        startDate: data.startDate,
        status: data.status ?? 'DRAFT',
      },
      include: { company: true },
    });
  }

  async findAll(filters?: {
    companyId?: string;
    status?: OfferStatus;
    sector?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};
    if (filters?.companyId) where.companyId = filters.companyId;
    if (filters?.status) where.status = filters.status;
    if (filters?.sector) where.sector = filters.sector;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { company: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    return this.prisma.offer.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, city: true, sector: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: ((filters?.page ?? 1) - 1) * (filters?.pageSize ?? 25),
      take: filters?.pageSize ?? 25,
    });
  }

  async findOne(id: string) {
    const o = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        company: true,
        matches: {
          include: {
            candidate: { include: { user: true } },
          },
          orderBy: { score: 'desc' },
        },
      },
    });
    if (!o) throw new NotFoundException('Offre non trouvée');
    return o;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      location: string;
      city: string;
      postalCode: string;
      latitude: number;
      longitude: number;
      sector: string;
      jobTitle: string;
      formation: string;
      contractType: any;
      startDate: Date;
      status: OfferStatus;
      closedAt: Date;
    }>,
  ) {
    return this.prisma.offer.update({
      where: { id },
      data,
      include: { company: true },
    });
  }

  async exportCsv(filters?: Parameters<OffersService['findAll']>[0]) {
    const rows = await this.findAll(filters);
    const escape = (v: string | number | null | undefined) =>
      v == null ? '' : String(v).replace(/"/g, '""');
    const line = (arr: (string | number | null | undefined)[]) =>
      arr.map((c) => `"${escape(c)}"`).join(',');
    const lines = [
      line(['Titre', 'Entreprise', 'Ville', 'Secteur', 'Statut', 'Nb matchs']),
      ...rows.map((o) =>
        line([
          o.title,
          (o.company as any)?.name ?? '',
          o.city,
          o.sector,
          o.status,
          (o as any)._count?.matches ?? 0,
        ]),
      ),
    ];
    return '\uFEFF' + lines.join('\r\n');
  }
}
