export const USER_ROLES = [
  'ADMIN',
  'COMMERCIAL',
  'ADMISSION',
  'CANDIDATE',
  'COMPANY',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const CANDIDATE_STATUSES = [
  'REGISTERED',
  'SEARCHING',
  'IN_PROCESS',
  'SIGNED',
  'ARCHIVED',
] as const;

export const COMPANY_STATUSES = ['PROSPECT', 'PARTNER', 'INACTIVE'] as const;

export const OFFER_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED', 'EXPIRED'] as const;

export const MATCH_STATUSES = [
  'PROPOSED',
  'VIEWED',
  'INTERVIEW_SCHEDULED',
  'ACCEPTED',
  'REJECTED',
] as const;

export const CONTRACT_TYPES = ['APPRENTICESHIP', 'PROFESSIONAL'] as const;

export const FORMATIONS = ['MBA', 'Master', 'Bachelor', 'Autre'] as const;

export const SECTORS = [
  'Commerce',
  'Marketing',
  'Finance',
  'RH',
  'Tech',
  'Consulting',
  'Autre',
] as const;

export const LABELS: Record<string, string> = {
  REGISTERED: 'Inscrit',
  SEARCHING: 'En recherche',
  IN_PROCESS: 'En cours',
  SIGNED: 'Signé',
  ARCHIVED: 'Archivé',
  PROSPECT: 'Prospect',
  PARTNER: 'Partenaire',
  INACTIVE: 'Inactif',
  DRAFT: 'Brouillon',
  ACTIVE: 'Active',
  CLOSED: 'Clôturée',
  EXPIRED: 'Expirée',
  PROPOSED: 'Proposé',
  VIEWED: 'Vu',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  APPRENTICESHIP: 'Apprentissage',
  PROFESSIONAL: 'Professionnalisation',
};
