import { Injectable } from '@nestjs/common';

export interface CandidateForQualification {
  status: string;
  formation: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  sectors?: string[];
  desiredJob?: string[];
  phone?: string | null;
  cvPath?: string | null;
  searchRadiusKm?: number | null;
}

export interface QualificationResult {
  score: number; // 0-100
  level: 'A' | 'B' | 'C'; // A = prêt à proposer, B = à compléter, C = inactif / incomplet
  criteria: {
    label: string;
    ok: boolean;
    weight: number;
  }[];
  summary: string;
}

/**
 * Service de qualification des candidats : score de "prêt à proposer" basé sur
 * le profil complet, le statut et les critères utiles au matching.
 */
@Injectable()
export class QualificationService {
  /**
   * Calcule le score de qualification et le niveau (A/B/C) pour un candidat.
   */
  computeQualification(candidate: CandidateForQualification): QualificationResult {
    const criteria: { label: string; ok: boolean; weight: number }[] = [];
    let score = 0;
    const maxScore = 100;

    // Statut en recherche = essentiel (30 pts)
    const isSearching = candidate.status === 'SEARCHING';
    criteria.push({
      label: 'En recherche d’alternance',
      ok: isSearching,
      weight: 30,
    });
    if (isSearching) score += 30;

    // Formation renseignée (15 pts)
    const hasFormation = !!candidate.formation?.trim() && candidate.formation !== 'Non renseigné';
    criteria.push({ label: 'Formation renseignée', ok: hasFormation, weight: 15 });
    if (hasFormation) score += 15;

    // Localisation (15 pts) — ville + (optionnel) géoloc pour le matching
    const hasCity = !!candidate.city?.trim();
    const hasGeo = candidate.latitude != null && candidate.longitude != null;
    criteria.push({ label: 'Ville renseignée', ok: hasCity, weight: 10 });
    if (hasCity) score += 10;
    criteria.push({ label: 'Géolocalisation (pour matching)', ok: hasGeo, weight: 5 });
    if (hasGeo) score += 5;

    // Critères de matching : secteurs ou métiers souhaités (15 pts)
    const hasSectors = (candidate.sectors?.length ?? 0) > 0;
    const hasDesiredJob = (candidate.desiredJob?.length ?? 0) > 0;
    criteria.push({
      label: 'Secteurs ou métiers souhaités',
      ok: hasSectors || hasDesiredJob,
      weight: 15,
    });
    if (hasSectors || hasDesiredJob) score += 15;

    // Contact (10 pts)
    const hasPhone = !!candidate.phone?.trim();
    criteria.push({ label: 'Téléphone renseigné', ok: hasPhone, weight: 10 });
    if (hasPhone) score += 10;

    // CV (10 pts) — bonus pour proposition
    const hasCv = !!candidate.cvPath?.trim();
    criteria.push({ label: 'CV disponible', ok: hasCv, weight: 10 });
    if (hasCv) score += 10;

    // Rayon de recherche cohérent (5 pts)
    const hasRadius = candidate.searchRadiusKm != null && candidate.searchRadiusKm > 0;
    criteria.push({ label: 'Rayon de recherche défini', ok: hasRadius, weight: 5 });
    if (hasRadius) score += 5;

    const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
    const normalizedScore = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
    const clampedScore = Math.min(100, Math.max(0, normalizedScore));

    let level: 'A' | 'B' | 'C';
    let summary: string;
    if (!isSearching) {
      level = 'C';
      summary = 'Candidat non en recherche — à ne pas proposer en priorité.';
    } else if (clampedScore >= 70) {
      level = 'A';
      summary = 'Profil prêt à proposer : critères principaux renseignés.';
    } else if (clampedScore >= 40) {
      level = 'B';
      summary = 'Profil à compléter pour améliorer le matching (secteurs, CV, géoloc).';
    } else {
      level = 'C';
      summary = 'Profil incomplet — compléter formation, ville et critères avant proposition.';
    }

    return {
      score: clampedScore,
      level,
      criteria,
      summary,
    };
  }

  /**
   * Retourne uniquement le score et le niveau (pour listes).
   */
  computeQuick(candidate: CandidateForQualification): { score: number; level: 'A' | 'B' | 'C' } {
    const r = this.computeQualification(candidate);
    return { score: r.score, level: r.level };
  }
}
