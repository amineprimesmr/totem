import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyStatus } from '@totem/database';
import { LocationService } from '../location/location.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private location: LocationService,
  ) {}

  async create(data: {
    name: string;
    sector: string;
    address: string;
    city: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    logoPath?: string;
    status?: CompanyStatus;
    contactUserId?: string;
    assignedToId?: string;
  }) {
    const hasCoordinates = data.latitude != null && data.longitude != null;
    const geocoded = hasCoordinates
      ? null
      : await this.location.geocodeCompany({
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
        });

    return this.prisma.company.create({
      data: {
        name: data.name,
        sector: data.sector,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        latitude: data.latitude ?? geocoded?.latitude,
        longitude: data.longitude ?? geocoded?.longitude,
        phone: data.phone,
        logoPath: data.logoPath,
        status: data.status ?? 'PROSPECT',
        contactUserId: data.contactUserId,
        assignedToId: data.assignedToId,
      },
      include: { contactUser: true, assignedTo: true },
    });
  }

  async findAll(filters?: {
    status?: CompanyStatus;
    assignedToId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { sector: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.company.findMany({
      where,
      include: {
        contactUser: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: ((filters?.page ?? 1) - 1) * (filters?.pageSize ?? 25),
      take: filters?.pageSize ?? 25,
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.company.findUnique({
      where: { id },
      include: {
        contactUser: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        offers: {
          include: {
            _count: { select: { matches: true } },
            matches: {
              include: { candidate: { include: { user: true } } },
              orderBy: { updatedAt: 'desc' },
            },
          },
        },
      },
    });
    if (!c) throw new NotFoundException('Entreprise non trouvée');
    const matches = c.offers.flatMap((o) => (o.matches || []).map((m) => ({ ...m, offer: { ...o, matches: undefined } })));
    matches.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { ...c, matches };
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      sector: string;
      address: string;
      city: string;
      postalCode: string;
      latitude: number;
      longitude: number;
      phone: string;
      logoPath: string;
      status: CompanyStatus;
      contactUserId: string | null;
      assignedToId: string | null;
    }>,
  ) {
    const current = await this.prisma.company.findUnique({
      where: { id },
      select: { address: true, city: true, postalCode: true, latitude: true, longitude: true },
    });
    const shouldTryGeocode =
      data.latitude == null &&
      data.longitude == null &&
      (data.address != null ||
        data.city != null ||
        data.postalCode != null ||
        current?.latitude == null ||
        current?.longitude == null);

    let geocoded: { latitude: number; longitude: number } | null = null;
    if (shouldTryGeocode) {
      geocoded = await this.location.geocodeCompany({
        address: data.address ?? current?.address,
        city: data.city ?? current?.city,
        postalCode: data.postalCode ?? current?.postalCode,
      });
    }

    const payload: any = { ...data };
    if (geocoded && payload.latitude == null && payload.longitude == null) {
      payload.latitude = geocoded.latitude;
      payload.longitude = geocoded.longitude;
    }

    return this.prisma.company.update({
      where: { id },
      data: payload,
      include: { contactUser: true, assignedTo: true },
    });
  }

  async assignCommercial(companyId: string, userId: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { assignedToId: userId },
      include: { assignedTo: true },
    });
  }

  async exportCsv(filters?: Parameters<CompaniesService['findAll']>[0]) {
    const rows = await this.findAll(filters);
    const escape = (v: string | number | null | undefined) =>
      v == null ? '' : String(v).replace(/"/g, '""');
    const line = (arr: (string | number | null | undefined)[]) =>
      arr.map((c) => `"${escape(c)}"`).join(',');
    const lines = [
      line(['Nom', 'Secteur', 'Ville', 'Statut', 'Nb offres', 'Assigné à']),
      ...rows.map((c) =>
        line([
          c.name,
          c.sector,
          c.city,
          c.status,
          (c as any)._count?.offers ?? 0,
          (c.assignedTo as any)?.name ?? (c.assignedTo as any)?.email ?? '',
        ]),
      ),
    ];
    return '\uFEFF' + lines.join('\r\n');
  }
}
