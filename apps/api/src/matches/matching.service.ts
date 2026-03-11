import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const EARTH_RADIUS_KM = 6371;

/** Pondération du score de matching (0-100). Modifiable via env MATCHING_WEIGHT_* */
export interface MatchingWeights {
  geo: number;
  formation: number;
  sector: number;
  contract: number;
  base: number;
}

const DEFAULT_WEIGHTS: MatchingWeights = {
  base: 30,
  geo: 30,
  formation: 25,
  sector: 10,
  contract: 5,
};

export interface ScoreBreakdown {
  geo: number; // 0-100
  formation: number;
  sector: number;
  contract: number;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function computeScoreAndBreakdown(
  distanceKm: number | null,
  candidateRadius: number,
  formationMatch: boolean,
  sectorMatch: boolean,
  contractMatch: boolean,
  weights: MatchingWeights = DEFAULT_WEIGHTS,
): { score: number; breakdown: ScoreBreakdown } {
  let geoScore = 50;
  if (distanceKm != null) {
    if (distanceKm <= candidateRadius) geoScore = 100;
    else if (distanceKm <= candidateRadius * 1.5) geoScore = 70;
    else geoScore = 30;
  }
  const formationScore = formationMatch ? 100 : 0;
  const sectorScore = sectorMatch ? 100 : 0;
  const contractScore = contractMatch ? 100 : 0;

  const total =
    weights.base +
    (weights.geo * geoScore) / 100 +
    (weights.formation * formationScore) / 100 +
    (weights.sector * sectorScore) / 100 +
    (weights.contract * contractScore) / 100;
  const score = Math.min(100, Math.max(0, Math.round(total)));

  return {
    score,
    breakdown: {
      geo: geoScore,
      formation: formationScore,
      sector: sectorScore,
      contract: contractScore,
    },
  };
}

@Injectable()
export class MatchingService {
  private weights: MatchingWeights;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.weights = {
      base: this.config.get<number>('MATCHING_WEIGHT_BASE') ?? DEFAULT_WEIGHTS.base,
      geo: this.config.get<number>('MATCHING_WEIGHT_GEO') ?? DEFAULT_WEIGHTS.geo,
      formation: this.config.get<number>('MATCHING_WEIGHT_FORMATION') ?? DEFAULT_WEIGHTS.formation,
      sector: this.config.get<number>('MATCHING_WEIGHT_SECTOR') ?? DEFAULT_WEIGHTS.sector,
      contract: this.config.get<number>('MATCHING_WEIGHT_CONTRACT') ?? DEFAULT_WEIGHTS.contract,
    };
  }

  async computeMatchesForCandidate(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) return [];

    const offers = await this.prisma.offer.findMany({
      where: { status: 'ACTIVE' },
      include: { company: true },
    });

    const radius = candidate.searchRadiusKm ?? 50;
    const results: {
      offerId: string;
      score: number;
      distanceKm: number | null;
      scoreBreakdown?: ScoreBreakdown;
    }[] = [];

    for (const offer of offers) {
      let distanceKm: number | null = null;
      if (
        candidate.latitude != null &&
        candidate.longitude != null &&
        offer.latitude != null &&
        offer.longitude != null
      ) {
        distanceKm = haversineDistance(
          candidate.latitude,
          candidate.longitude,
          offer.latitude,
          offer.longitude,
        );
      }
      const formationMatch =
        candidate.formation.toLowerCase() === offer.formation.toLowerCase();
      const sectorMatch =
        candidate.sectors.length === 0 ||
        candidate.sectors.some(
          (s) => s.toLowerCase() === offer.sector.toLowerCase(),
        );
      const contractMatch = candidate.contractType === offer.contractType;

      const { score, breakdown } = computeScoreAndBreakdown(
        distanceKm,
        radius,
        formationMatch,
        sectorMatch,
        contractMatch,
        this.weights,
      );

      results.push({
        offerId: offer.id,
        score,
        distanceKm,
        scoreBreakdown: breakdown,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 50);
  }

  async computeMatchesForOffer(offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { company: true },
    });
    if (!offer) return [];

    const candidates = await this.prisma.candidate.findMany({
      where: { status: 'SEARCHING' },
    });

    const results: {
      candidateId: string;
      score: number;
      distanceKm: number | null;
      scoreBreakdown?: ScoreBreakdown;
    }[] = [];

    for (const candidate of candidates) {
      let distanceKm: number | null = null;
      if (
        candidate.latitude != null &&
        candidate.longitude != null &&
        offer.latitude != null &&
        offer.longitude != null
      ) {
        distanceKm = haversineDistance(
          candidate.latitude,
          candidate.longitude,
          offer.latitude,
          offer.longitude,
        );
      }
      const radius = candidate.searchRadiusKm ?? 50;
      const formationMatch =
        candidate.formation.toLowerCase() === offer.formation.toLowerCase();
      const sectorMatch =
        candidate.sectors.length === 0 ||
        candidate.sectors.some(
          (s) => s.toLowerCase() === offer.sector.toLowerCase(),
        );
      const contractMatch = candidate.contractType === offer.contractType;

      const { score, breakdown } = computeScoreAndBreakdown(
        distanceKm,
        radius,
        formationMatch,
        sectorMatch,
        contractMatch,
        this.weights,
      );

      results.push({
        candidateId: candidate.id,
        score,
        distanceKm,
        scoreBreakdown: breakdown,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 50);
  }
}
