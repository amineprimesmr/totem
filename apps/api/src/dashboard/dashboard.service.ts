import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationService } from '../location/location.service';

const RENNES_CENTER = { lat: 48.1173, lng: -1.6778 };
const MAX_DISTANCE_KM = 90;
const ALLOWED_CITIES = new Set([
  'rennes',
  'cesson-sevigne',
  'cesson sevigne',
  'saint-gregoire',
  'saint gregoire',
  'chantepie',
  'vern-sur-seiche',
  'vern sur seiche',
  'betton',
  'pace',
  'bruz',
  'acigne',
  'chateaugiron',
  'thorigne-fouillard',
  'thorigne fouillard',
  'saint-jacques-de-la-lande',
  'saint jacques de la lande',
  'saint-malo',
  'saint malo',
]);

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private location: LocationService,
  ) {}

  async getKpis() {
    const [
      candidatesSearching,
      candidatesSigned,
      offersActive,
      matchesInProcess,
      companiesCount,
    ] = await Promise.all([
      this.prisma.candidate.count({ where: { status: 'SEARCHING' } }),
      this.prisma.candidate.count({ where: { status: 'SIGNED' } }),
      this.prisma.offer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.match.count({
        where: {
          status: { in: ['PROPOSED', 'VIEWED', 'INTERVIEW_SCHEDULED'] },
        },
      }),
      this.prisma.company.count(),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const signedThisMonth = await this.prisma.match.count({
      where: {
        status: 'ACCEPTED',
        updatedAt: { gte: startOfMonth },
      },
    });

    return {
      candidatesSearching,
      candidatesSigned,
      offersActive,
      matchesInProcess,
      companiesCount,
      signedThisMonth,
    };
  }

  async getFunnel() {
    const [registered, searching, inProcess, signed] = await Promise.all([
      this.prisma.candidate.count({ where: { status: 'REGISTERED' } }),
      this.prisma.candidate.count({ where: { status: 'SEARCHING' } }),
      this.prisma.candidate.count({ where: { status: 'IN_PROCESS' } }),
      this.prisma.candidate.count({ where: { status: 'SIGNED' } }),
    ]);
    return [
      { step: 'Inscrits', value: registered },
      { step: 'En recherche', value: searching },
      { step: 'En cours', value: inProcess },
      { step: 'Signés', value: signed },
    ];
  }

  async getKpisForCommercial(userId: string) {
    const [companiesCount, offersActive, matchesInProcess, signedThisMonth] = await Promise.all([
      this.prisma.company.count({ where: { assignedToId: userId } }),
      this.prisma.offer.count({
        where: { company: { assignedToId: userId }, status: 'ACTIVE' },
      }),
      this.prisma.match.count({
        where: {
          offer: { company: { assignedToId: userId } },
          status: { in: ['PROPOSED', 'VIEWED', 'INTERVIEW_SCHEDULED'] },
        },
      }),
      (async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return this.prisma.match.count({
          where: {
            offer: { company: { assignedToId: userId } },
            status: 'ACCEPTED',
            updatedAt: { gte: startOfMonth },
          },
        });
      })(),
    ]);
    return {
      companiesCount,
      offersActive,
      matchesInProcess,
      signedThisMonth,
    };
  }

  async getKpisForAdmission(userId: string) {
    const [candidatesCount, searching, matchesInProcess, signedThisMonth] = await Promise.all([
      this.prisma.candidate.count({ where: { assignedToId: userId } }),
      this.prisma.candidate.count({
        where: { assignedToId: userId, status: 'SEARCHING' },
      }),
      this.prisma.match.count({
        where: {
          candidate: { assignedToId: userId },
          status: { in: ['PROPOSED', 'VIEWED', 'INTERVIEW_SCHEDULED'] },
        },
      }),
      (async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return this.prisma.match.count({
          where: {
            candidate: { assignedToId: userId },
            status: 'ACCEPTED',
            updatedAt: { gte: startOfMonth },
          },
        });
      })(),
    ]);
    return {
      candidatesCount,
      searching,
      matchesInProcess,
      signedThisMonth,
    };
  }

  async getMapData() {
    await this.backfillMissingCoordinates();

    const [candidates, companies] = await Promise.all([
      this.prisma.candidate.findMany({
        where: { OR: [{ latitude: { not: null } }, { city: { not: '' } }] },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          city: true,
          formation: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      }),
      this.prisma.company.findMany({
        where: { OR: [{ latitude: { not: null } }, { city: { not: '' } }] },
        select: {
          id: true,
          name: true,
          city: true,
          sector: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      }),
    ]);

    const filteredCandidates = candidates.filter((c) =>
      isInsideRennesArea(c.latitude, c.longitude, c.city),
    );
    const filteredCompanies = companies.filter((c) =>
      isInsideRennesArea(c.latitude, c.longitude, c.city),
    );

    return { candidates: filteredCandidates, companies: filteredCompanies };
  }

  private async backfillMissingCoordinates() {
    const [candidates, companies] = await Promise.all([
      this.prisma.candidate.findMany({
        where: { OR: [{ latitude: null }, { longitude: null }] },
        select: { id: true, city: true, postalCode: true },
        take: 200,
      }),
      this.prisma.company.findMany({
        where: { OR: [{ latitude: null }, { longitude: null }] },
        select: { id: true, address: true, city: true, postalCode: true },
        take: 200,
      }),
    ]);

    for (const c of candidates) {
      const coords = await this.location.geocodeCandidate({
        city: c.city,
        postalCode: c.postalCode,
      });
      if (!coords) continue;
      await this.prisma.candidate.update({
        where: { id: c.id },
        data: { latitude: coords.latitude, longitude: coords.longitude },
      });
    }

    for (const co of companies) {
      const coords = await this.location.geocodeCompany({
        address: co.address,
        city: co.city,
        postalCode: co.postalCode,
      });
      if (!coords) continue;
      await this.prisma.company.update({
        where: { id: co.id },
        data: { latitude: coords.latitude, longitude: coords.longitude },
      });
    }
  }
}

function normalizeCity(city?: string | null) {
  return (city ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isInsideRennesArea(
  latitude?: number | null,
  longitude?: number | null,
  city?: string | null,
) {
  const normalizedCity = normalizeCity(city);
  if (ALLOWED_CITIES.has(normalizedCity)) return true;
  if (latitude == null || longitude == null) return false;
  return haversineKm(RENNES_CENTER.lat, RENNES_CENTER.lng, latitude, longitude) <= MAX_DISTANCE_KM;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}
