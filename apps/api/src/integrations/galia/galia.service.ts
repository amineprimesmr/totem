import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const EXTERNAL_SOURCE = 'GALIA';

export interface GaliaSyncResult {
  candidatesCreated: number;
  candidatesUpdated: number;
  companiesCreated: number;
  companiesUpdated: number;
  formationsCreated?: number;
  formationsUpdated?: number;
  promotionsCreated?: number;
  promotionsUpdated?: number;
  sessionsCreated?: number;
  absencesCreated?: number;
  gradesCreated?: number;
  documentsCreated?: number;
  errors: string[];
}

export type GaliaImportType =
  | 'candidates'
  | 'companies'
  | 'formations'
  | 'promotions'
  | 'sessions'
  | 'absences'
  | 'grades'
  | 'documents';

export interface GaliaAnalyzeResult {
  headers: string[];
  detectedColumns: Record<string, number>;
  previewRows: string[][];
  rowCount: number;
  errors: string[];
}

export interface GaliaCandidateRow {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  formation: string;
  city: string;
  postalCode?: string;
  externalId: string;
}

export interface GaliaCompanyRow {
  name: string;
  sector: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  externalId: string;
}

@Injectable()
export class GaliaService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Tente une synchronisation avec l'API Galia (si configurée).
   * Les endpoints réels dépendent de la doc fournie par SC Form.
   */
  async syncFromApi(): Promise<GaliaSyncResult> {
    const baseUrl = this.config.get<string>('GALIA_API_URL');
    const token = this.config.get<string>('GALIA_API_TOKEN');
    const result: GaliaSyncResult = {
      candidatesCreated: 0,
      candidatesUpdated: 0,
      companiesCreated: 0,
      companiesUpdated: 0,
      errors: [],
    };

    if (!baseUrl || !token) {
      result.errors.push(
        'GALIA_API_URL et GALIA_API_TOKEN doivent être configurés. Contacter SC Form pour obtenir les accès API.',
      );
      return result;
    }

    try {
      // TODO: remplacer par les vrais endpoints une fois la doc Galia reçue
      // Exemple: const stagiaires = await this.fetchGaliaStagiaires(baseUrl, token);
      // Puis pour chaque stagiaire: createOrUpdateCandidate(...)
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/stagiaires`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok && response.status !== 404) {
        result.errors.push(`API Galia stagiaires: ${response.status} ${response.statusText}`);
        return result;
      }
      if (response.status === 404) {
        result.errors.push(
          "Endpoint /api/stagiaires non disponible. Utiliser l'import CSV en attendant la doc API Galia.",
        );
        return result;
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      for (const row of list) {
        try {
          const mapped = this.mapGaliaStagiaireToRow(row);
          if (mapped) {
            const updated = await this.upsertCandidateFromGalia(mapped);
            if (updated) result.candidatesUpdated++;
            else result.candidatesCreated++;
          }
        } catch (e: any) {
          result.errors.push(`Candidat ${row?.id ?? row?.externalId ?? '?'}: ${e?.message ?? String(e)}`);
        }
      }

      const respCompanies = await fetch(`${baseUrl.replace(/\/$/, '')}/api/entreprises`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (respCompanies.ok) {
        const dataComp = await respCompanies.json();
        const listComp = Array.isArray(dataComp) ? dataComp : dataComp?.data ?? dataComp?.items ?? [];
        for (const row of listComp) {
          try {
            const mapped = this.mapGaliaEntrepriseToRow(row);
            if (mapped) {
              const updated = await this.upsertCompanyFromGalia(mapped);
              if (updated) result.companiesUpdated++;
              else result.companiesCreated++;
            }
          } catch (e: any) {
            result.errors.push(`Entreprise ${row?.id ?? row?.externalId ?? '?'}: ${e?.message ?? String(e)}`);
          }
        }
      }
    } catch (e: any) {
      result.errors.push(e?.message ?? String(e));
    }
    return result;
  }

  /** Mapping générique depuis un objet API Galia (à adapter selon la doc réelle). */
  private mapGaliaStagiaireToRow(row: any): GaliaCandidateRow | null {
    const externalId = row?.id ?? row?.externalId ?? row?.numeroStagiaire;
    const email = row?.email ?? row?.mail;
    if (!externalId || !email) return null;
    return {
      externalId: String(externalId),
      email: String(email).trim(),
      firstName: String(row?.firstName ?? row?.prenom ?? row?.first_name ?? '').trim(),
      lastName: String(row?.lastName ?? row?.nom ?? row?.last_name ?? '').trim(),
      phone: row?.phone ?? row?.telephone ?? undefined,
      formation: String(row?.formation ?? row?.parcours ?? '').trim() || 'Non renseigné',
      city: String(row?.city ?? row?.ville ?? row?.address?.city ?? '').trim() || 'Non renseigné',
      postalCode: row?.postalCode ?? row?.codePostal ?? row?.cp ?? undefined,
    };
  }

  private mapGaliaEntrepriseToRow(row: any): GaliaCompanyRow | null {
    const externalId = row?.id ?? row?.externalId;
    if (!externalId) return null;
    return {
      externalId: String(externalId),
      name: String(row?.name ?? row?.raisonSociale ?? row?.nom ?? '').trim(),
      sector: String(row?.sector ?? row?.secteur ?? 'Non renseigné').trim(),
      address: String(row?.address ?? row?.adresse ?? '').trim() || 'Non renseigné',
      city: String(row?.city ?? row?.ville ?? '').trim() || 'Non renseigné',
      postalCode: row?.postalCode ?? row?.codePostal ?? undefined,
      phone: row?.phone ?? row?.telephone ?? undefined,
    };
  }

  async upsertCandidateFromGalia(row: GaliaCandidateRow): Promise<boolean> {
    const existing = await this.prisma.candidate.findFirst({
      where: { externalId: row.externalId, externalSource: EXTERNAL_SOURCE },
      include: { user: true },
    });
    const defaultPassword = this.config.get<string>('GALIA_DEFAULT_PASSWORD') ?? 'ChangeMe123!';
    const hashed = await bcrypt.hash(defaultPassword, 10);

    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.userId },
        data: {
          email: row.email,
          name: `${row.firstName} ${row.lastName}`.trim(),
        },
      });
      await this.prisma.candidate.update({
        where: { id: existing.id },
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone ?? null,
          formation: row.formation,
          city: row.city,
          postalCode: row.postalCode ?? null,
        },
      });
      return true;
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: row.email } });
    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      const existingCand = await this.prisma.candidate.findUnique({ where: { userId } });
      if (existingCand) {
        await this.prisma.candidate.update({
          where: { id: existingCand.id },
          data: { externalId: row.externalId, externalSource: EXTERNAL_SOURCE },
        });
        return true;
      }
    } else {
      const user = await this.prisma.user.create({
        data: {
          email: row.email,
          password: hashed,
          role: 'CANDIDATE',
          name: `${row.firstName} ${row.lastName}`.trim(),
        },
      });
      userId = user.id;
    }

    await this.prisma.candidate.create({
      data: {
        userId,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        formation: row.formation,
        city: row.city,
        postalCode: row.postalCode,
        externalId: row.externalId,
        externalSource: EXTERNAL_SOURCE,
      },
    });
    return false;
  }

  async upsertCompanyFromGalia(row: GaliaCompanyRow): Promise<boolean> {
    const existing = await this.prisma.company.findFirst({
      where: { externalId: row.externalId, externalSource: EXTERNAL_SOURCE },
    });
    if (existing) {
      await this.prisma.company.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          sector: row.sector,
          address: row.address,
          city: row.city,
          postalCode: row.postalCode ?? null,
          phone: row.phone ?? null,
        },
      });
      return true;
    }
    await this.prisma.company.create({
      data: {
        name: row.name,
        sector: row.sector,
        address: row.address,
        city: row.city,
        postalCode: row.postalCode,
        phone: row.phone,
        externalId: row.externalId,
        externalSource: EXTERNAL_SOURCE,
      },
    });
    return false;
  }

  /**
   * Import candidats depuis un CSV.
   * Colonnes attendues (ordre ou noms) : email, firstName, lastName, phone?, formation, city, postalCode?, externalId
   */
  async importCandidatesFromCsv(csvContent: string): Promise<GaliaSyncResult> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new BadRequestException('CSV vide ou sans en-tête');
    const headers = this.parseCsvLine(lines[0]);
    const emailIdx = this.findColumn(headers, ['email', 'mail', 'courriel']);
    const firstNameIdx = this.findColumn(headers, ['firstName', 'prenom', 'first_name', 'prenom']);
    const lastNameIdx = this.findColumn(headers, ['lastName', 'nom', 'last_name']);
    const formationIdx = this.findColumn(headers, ['formation', 'parcours', 'filiere']);
    const cityIdx = this.findColumn(headers, ['city', 'ville', 'city']);
    const externalIdIdx = this.findColumn(headers, ['externalId', 'id', 'numeroStagiaire', 'id_galia']);
    if (
      emailIdx === -1 ||
      lastNameIdx === -1 ||
      formationIdx === -1 ||
      cityIdx === -1 ||
      externalIdIdx === -1
    ) {
      throw new BadRequestException(
        'Colonnes requises: email (ou mail), lastName (ou nom), formation, city, externalId (ou id)',
      );
    }
    const phoneIdx = this.findColumn(headers, ['phone', 'telephone', 'tel']);
    const postalCodeIdx = this.findColumn(headers, ['postalCode', 'codePostal', 'cp', 'code_postal']);

    const result: GaliaSyncResult = {
      candidatesCreated: 0,
      candidatesUpdated: 0,
      companiesCreated: 0,
      companiesUpdated: 0,
      errors: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const email = (cols[emailIdx] ?? '').trim();
      const externalId = (cols[externalIdIdx] ?? '').trim();
      if (!email || !externalId) {
        result.errors.push(`Ligne ${i + 1}: email et externalId requis`);
        continue;
      }
      const row: GaliaCandidateRow = {
        email,
        externalId,
        firstName: (cols[firstNameIdx] ?? '').trim() || 'Prénom',
        lastName: (cols[lastNameIdx] ?? '').trim() || 'Nom',
        phone: cols[phoneIdx]?.trim() || undefined,
        formation: (cols[formationIdx] ?? '').trim() || 'Non renseigné',
        city: (cols[cityIdx] ?? '').trim() || 'Non renseigné',
        postalCode: cols[postalCodeIdx]?.trim() || undefined,
      };
      try {
        const updated = await this.upsertCandidateFromGalia(row);
        if (updated) result.candidatesUpdated++;
        else result.candidatesCreated++;
      } catch (e: any) {
        result.errors.push(`Ligne ${i + 1}: ${e?.message ?? String(e)}`);
      }
    }
    return result;
  }

  /**
   * Import entreprises depuis un CSV.
   * Colonnes : name, sector, address, city, postalCode?, phone?, externalId
   */
  async importCompaniesFromCsv(csvContent: string): Promise<GaliaSyncResult> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new BadRequestException('CSV vide ou sans en-tête');
    const headers = this.parseCsvLine(lines[0]);
    const nameIdx = this.findColumn(headers, ['name', 'nom', 'raisonSociale', 'raison_sociale']);
    const sectorIdx = this.findColumn(headers, ['sector', 'secteur']);
    const addressIdx = this.findColumn(headers, ['address', 'adresse']);
    const cityIdx = this.findColumn(headers, ['city', 'ville']);
    const externalIdIdx = this.findColumn(headers, ['externalId', 'id', 'id_galia']);
    if (nameIdx === -1 || sectorIdx === -1 || addressIdx === -1 || cityIdx === -1 || externalIdIdx === -1) {
      throw new BadRequestException(
        'Colonnes requises: name (ou raisonSociale), sector, address, city, externalId (ou id)',
      );
    }
    const phoneIdx = this.findColumn(headers, ['phone', 'telephone', 'tel']);
    const postalCodeIdx = this.findColumn(headers, ['postalCode', 'codePostal', 'cp']);

    const result: GaliaSyncResult = {
      candidatesCreated: 0,
      candidatesUpdated: 0,
      companiesCreated: 0,
      companiesUpdated: 0,
      errors: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const externalId = (cols[externalIdIdx] ?? '').trim();
      if (!externalId) {
        result.errors.push(`Ligne ${i + 1}: externalId requis`);
        continue;
      }
      const row: GaliaCompanyRow = {
        externalId,
        name: (cols[nameIdx] ?? '').trim() || 'Entreprise',
        sector: (cols[sectorIdx] ?? '').trim() || 'Non renseigné',
        address: (cols[addressIdx] ?? '').trim() || 'Non renseigné',
        city: (cols[cityIdx] ?? '').trim() || 'Non renseigné',
        postalCode: cols[postalCodeIdx]?.trim() || undefined,
        phone: cols[phoneIdx]?.trim() || undefined,
      };
      try {
        const updated = await this.upsertCompanyFromGalia(row);
        if (updated) result.companiesUpdated++;
        else result.companiesCreated++;
      } catch (e: any) {
        result.errors.push(`Ligne ${i + 1}: ${e?.message ?? String(e)}`);
      }
    }
    return result;
  }

  /**
   * Analyse un CSV et détecte les colonnes selon le type d'import. Retourne un aperçu sans importer.
   */
  analyzeCsv(type: GaliaImportType, csvContent: string): GaliaAnalyzeResult {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    const result: GaliaAnalyzeResult = {
      headers: [],
      detectedColumns: {},
      previewRows: [],
      rowCount: 0,
      errors: [],
    };
    if (lines.length < 2) {
      result.errors.push('CSV vide ou sans en-tête');
      return result;
    }
    const headers = this.parseCsvLine(lines[0]);
    result.headers = headers;
    result.rowCount = lines.length - 1;

    const col = (names: string[]) => this.findColumn(headers, names);
    switch (type) {
      case 'candidates':
        result.detectedColumns = {
          email: col(['email', 'mail', 'courriel']),
          lastName: col(['lastName', 'nom', 'last_name']),
          firstName: col(['firstName', 'prenom', 'first_name']),
          formation: col(['formation', 'parcours', 'filiere']),
          city: col(['city', 'ville']),
          externalId: col(['externalId', 'id', 'numeroStagiaire', 'id_galia']),
          phone: col(['phone', 'telephone', 'tel']),
          postalCode: col(['postalCode', 'codePostal', 'cp']),
          promotionId: col(['promotionId', 'promotion_externalId', 'id_promotion']),
        };
        break;
      case 'companies':
        result.detectedColumns = {
          name: col(['name', 'nom', 'raisonSociale']),
          sector: col(['sector', 'secteur']),
          address: col(['address', 'adresse']),
          city: col(['city', 'ville']),
          externalId: col(['externalId', 'id', 'id_galia']),
          phone: col(['phone', 'telephone']),
          postalCode: col(['postalCode', 'codePostal', 'cp']),
        };
        break;
      case 'formations':
        result.detectedColumns = {
          name: col(['name', 'nom', 'formation', 'libelle']),
          level: col(['level', 'niveau', 'niveau_formation']),
          contractType: col(['contractType', 'type_contrat', 'typeContrat']),
          durationMonths: col(['durationMonths', 'duree_mois', 'duree']),
          externalId: col(['externalId', 'id', 'id_galia']),
        };
        break;
      case 'promotions':
        result.detectedColumns = {
          formationExternalId: col(['formationExternalId', 'formation_id', 'id_formation', 'formationId']),
          formationName: col(['formationName', 'formation_name', 'formation']),
          name: col(['name', 'nom', 'promo', 'libelle']),
          year: col(['year', 'annee', 'annee_promo']),
          externalId: col(['externalId', 'id', 'id_galia']),
          startDate: col(['startDate', 'date_debut', 'dateDebut']),
          endDate: col(['endDate', 'date_fin', 'dateFin']),
        };
        break;
      case 'sessions':
        result.detectedColumns = {
          promotionExternalId: col(['promotionExternalId', 'promotion_id', 'id_promotion']),
          roomName: col(['roomName', 'room', 'salle', 'lieu']),
          title: col(['title', 'titre', 'libelle', 'matiere']),
          startAt: col(['startAt', 'start', 'date_debut', 'date_heure_debut']),
          endAt: col(['endAt', 'end', 'date_fin', 'date_heure_fin']),
          type: col(['type', 'session_type']),
          externalId: col(['externalId', 'id', 'id_galia']),
        };
        break;
      case 'absences':
        result.detectedColumns = {
          candidateExternalId: col(['candidateExternalId', 'externalId', 'id_stagiaire', 'id_candidat']),
          date: col(['date', 'date_absence', 'dateAbsence']),
          type: col(['type', 'type_absence']),
          justified: col(['justified', 'justifie', 'justifié']),
          notes: col(['notes', 'commentaire', 'motif']),
        };
        break;
      case 'grades':
        result.detectedColumns = {
          candidateExternalId: col(['candidateExternalId', 'externalId', 'id_stagiaire', 'id_candidat']),
          subject: col(['subject', 'matiere', 'matière', 'discipline']),
          value: col(['value', 'note', 'valeur']),
          scale: col(['scale', 'barème', 'bareme', 'sur']),
          coefficient: col(['coefficient', 'coef', 'coefficient']),
          label: col(['label', 'libelle', 'type_note']),
        };
        break;
      case 'documents':
        result.detectedColumns = {
          candidateExternalId: col(['candidateExternalId', 'externalId', 'id_stagiaire', 'id_candidat']),
          type: col(['type', 'type_document', 'document_type']),
          name: col(['name', 'nom', 'libelle', 'titre']),
          filePath: col(['filePath', 'path', 'chemin', 'url', 'fichier']),
        };
        break;
    }

    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      result.previewRows.push(this.parseCsvLine(lines[i]));
    }
    return result;
  }

  async importFormationsFromCsv(csvContent: string): Promise<GaliaSyncResult> {
    const result = this.initImportResult();
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      result.errors.push('CSV vide ou sans en-tête');
      return result;
    }
    const headers = this.parseCsvLine(lines[0]);
    const nameIdx = this.findColumn(headers, ['name', 'nom', 'formation', 'libelle']);
    const externalIdIdx = this.findColumn(headers, ['externalId', 'id', 'id_galia']);
    if (nameIdx === -1) {
      result.errors.push('Colonne requise: name (ou nom, formation, libelle)');
      return result;
    }
    const levelIdx = this.findColumn(headers, ['level', 'niveau']);
    const contractIdx = this.findColumn(headers, ['contractType', 'type_contrat', 'typeContrat']);
    const durationIdx = this.findColumn(headers, ['durationMonths', 'duree_mois', 'duree']);

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const name = (cols[nameIdx] ?? '').trim();
      if (!name) {
        result.errors.push(`Ligne ${i + 1}: nom requis`);
        continue;
      }
      const externalId = externalIdIdx >= 0 ? (cols[externalIdIdx] ?? '').trim() : undefined;
      try {
        const existing = externalId
          ? await this.prisma.formation.findFirst({ where: { externalId, externalSource: EXTERNAL_SOURCE } })
          : await this.prisma.formation.findFirst({ where: { name } });
        const data: any = {
          name,
          level: levelIdx >= 0 ? cols[levelIdx]?.trim() || null : undefined,
          contractType: (contractIdx >= 0 ? cols[contractIdx]?.trim() : null) === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'APPRENTICESHIP',
          durationMonths: durationIdx >= 0 ? parseInt(cols[durationIdx] ?? '', 10) || undefined : undefined,
          externalSource: EXTERNAL_SOURCE,
        };
        if (externalId) data.externalId = externalId;
        if (existing) {
          await this.prisma.formation.update({ where: { id: existing.id }, data });
          result.formationsUpdated = (result.formationsUpdated ?? 0) + 1;
        } else {
          await this.prisma.formation.create({ data: { ...data, active: true, externalId: externalId || null } });
          result.formationsCreated = (result.formationsCreated ?? 0) + 1;
        }
      } catch (e: any) {
        result.errors.push(`Ligne ${i + 1}: ${e?.message ?? String(e)}`);
      }
    }
    return result;
  }

  async importPromotionsFromCsv(csvContent: string): Promise<GaliaSyncResult> {
    const result = this.initImportResult();
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      result.errors.push('CSV vide ou sans en-tête');
      return result;
    }
    const headers = this.parseCsvLine(lines[0]);
    const formationIdIdx = this.findColumn(headers, ['formationId', 'formation_id']);
    const formationExtIdx = this.findColumn(headers, ['formationExternalId', 'formation_externalId', 'id_formation']);
    const formationNameIdx = this.findColumn(headers, ['formationName', 'formation_name', 'formation']);
    const nameIdx = this.findColumn(headers, ['name', 'nom', 'promo', 'libelle']);
    const yearIdx = this.findColumn(headers, ['year', 'annee', 'annee_promo']);
    const externalIdIdx = this.findColumn(headers, ['externalId', 'id', 'id_galia']);
    if (nameIdx === -1 || yearIdx === -1) {
      result.errors.push('Colonnes requises: name (ou promo), year (ou annee)');
      return result;
    }
    const startIdx = this.findColumn(headers, ['startDate', 'date_debut', 'dateDebut']);
    const endIdx = this.findColumn(headers, ['endDate', 'date_fin', 'dateFin']);

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const name = (cols[nameIdx] ?? '').trim();
      const year = parseInt(cols[yearIdx] ?? '', 10);
      if (!name || isNaN(year)) {
        result.errors.push(`Ligne ${i + 1}: name et year requis`);
        continue;
      }
      let formationId: string | null = null;
      if (formationIdIdx >= 0 && cols[formationIdIdx]?.trim()) {
        formationId = cols[formationIdIdx].trim();
      } else if (formationExtIdx >= 0 && cols[formationExtIdx]?.trim()) {
        const f = await this.prisma.formation.findFirst({
          where: { externalId: cols[formationExtIdx].trim(), externalSource: EXTERNAL_SOURCE },
        });
        formationId = f?.id ?? null;
      } else if (formationNameIdx >= 0 && cols[formationNameIdx]?.trim()) {
        const f = await this.prisma.formation.findFirst({
          where: { name: { equals: cols[formationNameIdx].trim(), mode: 'insensitive' } },
        });
        formationId = f?.id ?? null;
      }
      if (!formationId) {
        result.errors.push(`Ligne ${i + 1}: formation introuvable (formationId, formationExternalId ou formationName)`);
        continue;
      }
      const externalId = externalIdIdx >= 0 ? (cols[externalIdIdx] ?? '').trim() : undefined;
      try {
        const existing = externalId
          ? await this.prisma.promotion.findFirst({ where: { externalId, externalSource: EXTERNAL_SOURCE } })
          : await this.prisma.promotion.findFirst({ where: { formationId, name, year } });
        const data = {
          formationId,
          name,
          year,
          startDate: startIdx >= 0 && cols[startIdx]?.trim() ? new Date(cols[startIdx]) : undefined,
          endDate: endIdx >= 0 && cols[endIdx]?.trim() ? new Date(cols[endIdx]) : undefined,
          externalId: externalId || undefined,
          externalSource: EXTERNAL_SOURCE,
        };
        if (existing) {
          await this.prisma.promotion.update({ where: { id: existing.id }, data });
          result.promotionsUpdated = (result.promotionsUpdated ?? 0) + 1;
        } else {
          await this.prisma.promotion.create({ data });
          result.promotionsCreated = (result.promotionsCreated ?? 0) + 1;
        }
      } catch (e: any) {
        result.errors.push(`Ligne ${i + 1}: ${e?.message ?? String(e)}`);
      }
    }
    return result;
  }

  async importAbsencesFromCsv(csvContent: string): Promise<GaliaSyncResult> {
    const result = this.initImportResult();
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      result.errors.push('CSV vide ou sans en-tête');
      return result;
    }
    const headers = this.parseCsvLine(lines[0]);
    const candExtIdx = this.findColumn(headers, ['candidateExternalId', 'externalId', 'id_stagiaire', 'id_candidat']);
    const dateIdx = this.findColumn(headers, ['date', 'date_absence', 'dateAbsence']);
    if (candExtIdx === -1 || dateIdx === -1) {
      result.errors.push('Colonnes requises: candidateExternalId (ou externalId), date');
      return result;
    }
    const typeIdx = this.findColumn(headers, ['type', 'type_absence']);
    const justifiedIdx = this.findColumn(headers, ['justified', 'justifie']);
    const notesIdx = this.findColumn(headers, ['notes', 'commentaire', 'motif']);

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const externalId = (cols[candExtIdx] ?? '').trim();
      const dateStr = (cols[dateIdx] ?? '').trim();
      if (!externalId || !dateStr) {
        result.errors.push(`Ligne ${i + 1}: candidateExternalId et date requis`);
        continue;
      }
      const candidate = await this.prisma.candidate.findFirst({
        where: { externalId, externalSource: EXTERNAL_SOURCE },
      });
      if (!candidate) {
        result.errors.push(`Ligne ${i + 1}: candidat externalId ${externalId} introuvable`);
        continue;
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        result.errors.push(`Ligne ${i + 1}: date invalide`);
        continue;
      }
      const typeVal = typeIdx >= 0 ? (cols[typeIdx]?.trim().toUpperCase() || 'ABSENCE') : 'ABSENCE';
      const type = typeVal === 'LATE' ? 'LATE' : typeVal === 'EXCUSED' ? 'EXCUSED' : 'ABSENCE';
      const justified = justifiedIdx >= 0 ? /^(1|true|oui|yes)$/i.test((cols[justifiedIdx] ?? '').trim()) : false;
      try {
        await this.prisma.absence.create({
          data: {
            candidateId: candidate.id,
            date,
            type,
            justified,
            notes: notesIdx >= 0 ? cols[notesIdx]?.trim() : undefined,
            externalSource: EXTERNAL_SOURCE,
          },
        });
        result.absencesCreated = (result.absencesCreated ?? 0) + 1;
      } catch (e: any) {
        result.errors.push(`Ligne ${i + 1}: ${e?.message ?? String(e)}`);
      }
    }
    return result;
  }

  async importGradesFromCsv(csvContent: string): Promise<GaliaSyncResult> {
    const result = this.initImportResult();
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      result.errors.push('CSV vide ou sans en-tête');
      return result;
    }
    const headers = this.parseCsvLine(lines[0]);
    const candExtIdx = this.findColumn(headers, ['candidateExternalId', 'externalId', 'id_stagiaire', 'id_candidat']);
    const valueIdx = this.findColumn(headers, ['value', 'note', 'valeur']);
    if (candExtIdx === -1 || valueIdx === -1) {
      result.errors.push('Colonnes requises: candidateExternalId (ou externalId), value (ou note)');
      return result;
    }
    const subjectIdx = this.findColumn(headers, ['subject', 'matiere', 'matière', 'discipline']);
    const scaleIdx = this.findColumn(headers, ['scale', 'barème', 'bareme', 'sur']);
    const coefIdx = this.findColumn(headers, ['coefficient', 'coef']);
    const labelIdx = this.findColumn(headers, ['label', 'libelle', 'type_note']);

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const externalId = (cols[candExtIdx] ?? '').trim();
      const value = parseFloat((cols[valueIdx] ?? '').replace(',', '.'));
      if (!externalId || isNaN(value)) {
        result.errors.push(`Ligne ${i + 1}: candidateExternalId et value (nombre) requis`);
        continue;
      }
      const candidate = await this.prisma.candidate.findFirst({
        where: { externalId, externalSource: EXTERNAL_SOURCE },
      });
      if (!candidate) {
        result.errors.push(`Ligne ${i + 1}: candidat externalId ${externalId} introuvable`);
        continue;
      }
      try {
        await this.prisma.grade.create({
          data: {
            candidateId: candidate.id,
            value,
            scale: scaleIdx >= 0 ? parseFloat((cols[scaleIdx] ?? '20').replace(',', '.')) || 20 : 20,
            coefficient: coefIdx >= 0 ? parseFloat((cols[coefIdx] ?? '1').replace(',', '.')) || 1 : 1,
            subject: subjectIdx >= 0 ? cols[subjectIdx]?.trim() : undefined,
            label: labelIdx >= 0 ? cols[labelIdx]?.trim() : undefined,
            externalSource: EXTERNAL_SOURCE,
          },
        });
        result.gradesCreated = (result.gradesCreated ?? 0) + 1;
      } catch (e: any) {
        result.errors.push(`Ligne ${i + 1}: ${e?.message ?? String(e)}`);
      }
    }
    return result;
  }

  async importDocumentsFromCsv(csvContent: string): Promise<GaliaSyncResult> {
    const result = this.initImportResult();
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      result.errors.push('CSV vide ou sans en-tête');
      return result;
    }
    const headers = this.parseCsvLine(lines[0]);
    const candExtIdx = this.findColumn(headers, ['candidateExternalId', 'externalId', 'id_stagiaire', 'id_candidat']);
    const typeIdx = this.findColumn(headers, ['type', 'type_document', 'document_type']);
    const nameIdx = this.findColumn(headers, ['name', 'nom', 'libelle', 'titre']);
    const filePathIdx = this.findColumn(headers, ['filePath', 'path', 'chemin', 'url', 'fichier']);
    if (candExtIdx === -1 || nameIdx === -1 || filePathIdx === -1) {
      result.errors.push('Colonnes requises: candidateExternalId, name, filePath (ou path, url)');
      return result;
    }
    const typeMap: Record<string, string> = {
      SIFA: 'SIFA',
      CERFA: 'CERFA',
      CONVENTION: 'CONVENTION',
      CONTRACT: 'CONTRACT',
      BULLETIN: 'BULLETIN',
      OTHER: 'OTHER',
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      const externalId = (cols[candExtIdx] ?? '').trim();
      const name = (cols[nameIdx] ?? '').trim();
      const filePath = (cols[filePathIdx] ?? '').trim();
      if (!externalId || !name || !filePath) {
        result.errors.push(`Ligne ${i + 1}: candidateExternalId, name et filePath requis`);
        continue;
      }
      const candidate = await this.prisma.candidate.findFirst({
        where: { externalId, externalSource: EXTERNAL_SOURCE },
      });
      if (!candidate) {
        result.errors.push(`Ligne ${i + 1}: candidat externalId ${externalId} introuvable`);
        continue;
      }
      const typeStr = typeIdx >= 0 ? (cols[typeIdx] ?? '').trim().toUpperCase() : 'OTHER';
      const type = typeMap[typeStr] ?? 'OTHER';
      try {
        await this.prisma.document.create({
          data: {
            candidateId: candidate.id,
            type: type as any,
            name,
            filePath,
            externalSource: EXTERNAL_SOURCE,
          },
        });
        result.documentsCreated = (result.documentsCreated ?? 0) + 1;
      } catch (e: any) {
        result.errors.push(`Ligne ${i + 1}: ${e?.message ?? String(e)}`);
      }
    }
    return result;
  }

  private initImportResult(): GaliaSyncResult {
    return {
      candidatesCreated: 0,
      candidatesUpdated: 0,
      companiesCreated: 0,
      companiesUpdated: 0,
      formationsCreated: 0,
      formationsUpdated: 0,
      promotionsCreated: 0,
      promotionsUpdated: 0,
      sessionsCreated: 0,
      absencesCreated: 0,
      gradesCreated: 0,
      documentsCreated: 0,
      errors: [],
    };
  }

  private parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === ',' || c === ';') && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur.trim());
    return out;
  }

  private findColumn(headers: string[], names: string[]): number {
    const lower = headers.map((h) => h.toLowerCase().trim());
    for (const n of names) {
      const idx = lower.indexOf(n.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  }
}
