import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConventionStatus } from '@totem/database';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreateConventionDto } from './dto/create-convention.dto';
import { UpdateConventionDto } from './dto/update-convention.dto';

@Injectable()
export class OrganisationService {
  constructor(private prisma: PrismaService) {}

  // ----- Formations -----
  async createFormation(dto: CreateFormationDto) {
    return this.prisma.formation.create({
      data: {
        name: dto.name,
        level: dto.level,
        contractType: dto.contractType ?? 'APPRENTICESHIP',
        durationMonths: dto.durationMonths,
        description: dto.description,
        active: dto.active ?? true,
      },
    });
  }

  async findAllFormations(activeOnly?: boolean) {
    const where = activeOnly ? { active: true } : {};
    return this.prisma.formation.findMany({
      where,
      include: { _count: { select: { promotions: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneFormation(id: string) {
    const f = await this.prisma.formation.findUnique({
      where: { id },
      include: { promotions: { orderBy: { year: 'desc' } } },
    });
    if (!f) throw new NotFoundException('Formation introuvable');
    return f;
  }

  async updateFormation(id: string, dto: UpdateFormationDto) {
    await this.findOneFormation(id);
    return this.prisma.formation.update({
      where: { id },
      data: {
        name: dto.name,
        level: dto.level,
        contractType: dto.contractType,
        durationMonths: dto.durationMonths,
        description: dto.description,
        active: dto.active,
      },
    });
  }

  async removeFormation(id: string) {
    await this.findOneFormation(id);
    const count = await this.prisma.promotion.count({ where: { formationId: id } });
    if (count > 0) throw new ConflictException('Impossible de supprimer une formation qui a des promotions');
    return this.prisma.formation.delete({ where: { id } });
  }

  // ----- Promotions -----
  async createPromotion(dto: CreatePromotionDto) {
    await this.prisma.formation.findUniqueOrThrow({ where: { id: dto.formationId } });
    return this.prisma.promotion.create({
      data: {
        formationId: dto.formationId,
        name: dto.name,
        year: dto.year,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        capacity: dto.capacity,
      },
      include: { formation: true },
    });
  }

  async findAllPromotions(formationId?: string, year?: number) {
    const where: any = {};
    if (formationId) where.formationId = formationId;
    if (year != null) where.year = year;
    return this.prisma.promotion.findMany({
      where,
      include: {
        formation: { select: { id: true, name: true, level: true, contractType: true } },
        _count: { select: { candidates: true, conventions: true } },
      },
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });
  }

  async findOnePromotion(id: string) {
    const p = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        formation: true,
        candidates: { select: { id: true, firstName: true, lastName: true, status: true } },
        conventions: { include: { candidate: true, offer: true, company: true } },
      },
    });
    if (!p) throw new NotFoundException('Promotion introuvable');
    return p;
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto) {
    await this.findOnePromotion(id);
    return this.prisma.promotion.update({
      where: { id },
      data: {
        formationId: dto.formationId,
        name: dto.name,
        year: dto.year,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        capacity: dto.capacity,
      },
      include: { formation: true },
    });
  }

  async removePromotion(id: string) {
    await this.findOnePromotion(id);
    return this.prisma.promotion.delete({ where: { id } });
  }

  // ----- Conventions -----
  async createConvention(dto: CreateConventionDto) {
    const [candidate, offer, company] = await Promise.all([
      this.prisma.candidate.findUniqueOrThrow({ where: { id: dto.candidateId } }),
      this.prisma.offer.findUniqueOrThrow({ where: { id: dto.offerId } }),
      this.prisma.company.findUniqueOrThrow({ where: { id: dto.companyId } }),
    ]);
    if (offer.companyId !== company.id) throw new ConflictException('Offre et entreprise incohérents');
    const existing = await this.prisma.convention.findUnique({
      where: { candidateId_offerId: { candidateId: dto.candidateId, offerId: dto.offerId } },
    });
    if (existing) throw new ConflictException('Une convention existe déjà pour ce candidat et cette offre');
    return this.prisma.convention.create({
      data: {
        candidateId: dto.candidateId,
        offerId: dto.offerId,
        companyId: dto.companyId,
        promotionId: dto.promotionId,
        status: dto.status ?? ConventionStatus.DRAFT,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        documentPath: dto.documentPath,
        notes: dto.notes,
      },
      include: { candidate: true, offer: true, company: true, promotion: true },
    });
  }

  async findAllConventions(filters?: { candidateId?: string; companyId?: string; promotionId?: string; status?: ConventionStatus }) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.companyId) where.companyId = filters.companyId;
    if (filters?.promotionId) where.promotionId = filters.promotionId;
    if (filters?.status) where.status = filters.status;
    return this.prisma.convention.findMany({
      where,
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, formation: true, status: true } },
        offer: { select: { id: true, title: true, jobTitle: true, companyId: true } },
        company: { select: { id: true, name: true } },
        promotion: { select: { id: true, name: true, year: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneConvention(id: string) {
    const c = await this.prisma.convention.findUnique({
      where: { id },
      include: { candidate: true, offer: true, company: true, promotion: true },
    });
    if (!c) throw new NotFoundException('Convention introuvable');
    return c;
  }

  async updateConvention(id: string, dto: UpdateConventionDto) {
    await this.findOneConvention(id);
    return this.prisma.convention.update({
      where: { id },
      data: {
        promotionId: dto.promotionId,
        status: dto.status,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        documentPath: dto.documentPath,
        notes: dto.notes,
      },
      include: { candidate: true, offer: true, company: true, promotion: true },
    });
  }

  async removeConvention(id: string) {
    await this.findOneConvention(id);
    return this.prisma.convention.delete({ where: { id } });
  }

  /** Statistiques organisation pour le dashboard */
  async getOrganisationStats() {
    const [formationsCount, promotionsCount, conventionsByStatus, conventionsSignedThisMonth] = await Promise.all([
      this.prisma.formation.count({ where: { active: true } }),
      this.prisma.promotion.count(),
      this.prisma.convention.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      (() => {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return this.prisma.convention.count({
          where: { status: 'SIGNED', signedAt: { gte: start } },
        });
      })(),
    ]);
    const byStatus: Record<string, number> = {};
    conventionsByStatus.forEach((g) => { byStatus[g.status] = g._count.id; });
    return {
      formationsCount,
      promotionsCount,
      conventionsByStatus: byStatus,
      conventionsSignedThisMonth,
    };
  }
}
