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
