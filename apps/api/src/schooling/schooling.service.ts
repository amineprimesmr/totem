import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const EXTERNAL_SOURCE = 'GALIA';

@Injectable()
export class SchoolingService {
  constructor(private prisma: PrismaService) {}

  // ----- Rooms -----
  async createRoom(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: { name: dto.name, capacity: dto.capacity ?? undefined, building: dto.building },
    });
  }

  async findAllRooms() {
    return this.prisma.room.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { sessions: true } } },
    });
  }

  async findOneRoom(id: string) {
    const r = await this.prisma.room.findUnique({ where: { id }, include: { sessions: true } });
    if (!r) throw new NotFoundException('Salle introuvable');
    return r;
  }

  async updateRoom(id: string, dto: Partial<CreateRoomDto>) {
    await this.findOneRoom(id);
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  async removeRoom(id: string) {
    await this.findOneRoom(id);
    return this.prisma.room.delete({ where: { id } });
  }

  // ----- Sessions -----
  async createSession(dto: CreateSessionDto) {
    return this.prisma.session.create({
      data: {
        promotionId: dto.promotionId,
        roomId: dto.roomId,
        title: dto.title,
        description: dto.description,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        type: dto.type ?? 'COURSE',
      },
      include: { promotion: true, room: true },
    });
  }

  async findAllSessions(filters?: { promotionId?: string; roomId?: string; from?: string; to?: string }) {
    const where: any = {};
    if (filters?.promotionId) where.promotionId = filters.promotionId;
    if (filters?.roomId) where.roomId = filters.roomId;
    if (filters?.from || filters?.to) {
      where.startAt = {};
      if (filters.from) where.startAt.gte = new Date(filters.from);
      if (filters.to) where.startAt.lte = new Date(filters.to);
    }
    return this.prisma.session.findMany({
      where,
      include: { promotion: { select: { id: true, name: true, year: true } }, room: true },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOneSession(id: string) {
    const s = await this.prisma.session.findUnique({
      where: { id },
      include: { promotion: true, room: true, absences: true, grades: true },
    });
    if (!s) throw new NotFoundException('Session introuvable');
    return s;
  }

  async updateSession(id: string, dto: UpdateSessionDto) {
    await this.findOneSession(id);
    return this.prisma.session.update({
      where: { id },
      data: {
        promotionId: dto.promotionId,
        roomId: dto.roomId,
        title: dto.title,
        description: dto.description,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        type: dto.type,
      },
      include: { promotion: true, room: true },
    });
  }

  async removeSession(id: string) {
    await this.findOneSession(id);
    return this.prisma.session.delete({ where: { id } });
  }

  // ----- Absences -----
  async createAbsence(dto: CreateAbsenceDto) {
    return this.prisma.absence.create({
      data: {
        candidateId: dto.candidateId,
        sessionId: dto.sessionId,
        date: new Date(dto.date),
        type: dto.type ?? 'ABSENCE',
        justified: dto.justified ?? false,
        notes: dto.notes,
      },
      include: { candidate: true, session: true },
    });
  }

  async findAllAbsences(filters?: { candidateId?: string; sessionId?: string; from?: string; to?: string }) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.sessionId) where.sessionId = filters.sessionId;
    if (filters?.from || filters?.to) {
      where.date = {};
      if (filters.from) where.date.gte = new Date(filters.from);
      if (filters.to) where.date.lte = new Date(filters.to);
    }
    return this.prisma.absence.findMany({
      where,
      include: { candidate: { select: { id: true, firstName: true, lastName: true } }, session: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOneAbsence(id: string) {
    const a = await this.prisma.absence.findUnique({
      where: { id },
      include: { candidate: true, session: true },
    });
    if (!a) throw new NotFoundException('Absence introuvable');
    return a;
  }

  async updateAbsence(id: string, dto: UpdateAbsenceDto) {
    await this.findOneAbsence(id);
    return this.prisma.absence.update({
      where: { id },
      data: {
        sessionId: dto.sessionId,
        date: dto.date ? new Date(dto.date) : undefined,
        type: dto.type,
        justified: dto.justified,
        notes: dto.notes,
      },
      include: { candidate: true, session: true },
    });
  }

  async removeAbsence(id: string) {
    await this.findOneAbsence(id);
    return this.prisma.absence.delete({ where: { id } });
  }

  // ----- Grades -----
  async createGrade(dto: CreateGradeDto) {
    return this.prisma.grade.create({
      data: {
        candidateId: dto.candidateId,
        sessionId: dto.sessionId,
        subject: dto.subject,
        value: dto.value,
        scale: dto.scale ?? 20,
        coefficient: dto.coefficient ?? 1,
        label: dto.label,
      },
      include: { candidate: true, session: true },
    });
  }

  async findAllGrades(filters?: { candidateId?: string; sessionId?: string; subject?: string }) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.sessionId) where.sessionId = filters.sessionId;
    if (filters?.subject) where.subject = { contains: filters.subject, mode: 'insensitive' };
    return this.prisma.grade.findMany({
      where,
      include: { candidate: { select: { id: true, firstName: true, lastName: true } }, session: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneGrade(id: string) {
    const g = await this.prisma.grade.findUnique({
      where: { id },
      include: { candidate: true, session: true },
    });
    if (!g) throw new NotFoundException('Note introuvable');
    return g;
  }

  async updateGrade(id: string, dto: UpdateGradeDto) {
    await this.findOneGrade(id);
    return this.prisma.grade.update({
      where: { id },
      data: {
        sessionId: dto.sessionId,
        subject: dto.subject,
        value: dto.value,
        scale: dto.scale,
        coefficient: dto.coefficient,
        label: dto.label,
      },
      include: { candidate: true, session: true },
    });
  }

  async removeGrade(id: string) {
    await this.findOneGrade(id);
    return this.prisma.grade.delete({ where: { id } });
  }

  // ----- Documents -----
  async createDocument(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        candidateId: dto.candidateId,
        type: dto.type,
        name: dto.name,
        filePath: dto.filePath,
        mimeType: dto.mimeType,
      },
      include: { candidate: true },
    });
  }

  async findAllDocuments(filters?: { candidateId?: string; type?: string }) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.type) where.type = filters.type;
    return this.prisma.document.findMany({
      where,
      include: { candidate: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneDocument(id: string) {
    const d = await this.prisma.document.findUnique({
      where: { id },
      include: { candidate: true },
    });
    if (!d) throw new NotFoundException('Document introuvable');
    return d;
  }

  async updateDocument(id: string, dto: UpdateDocumentDto) {
    await this.findOneDocument(id);
    return this.prisma.document.update({
      where: { id },
      data: { type: dto.type, name: dto.name, filePath: dto.filePath, mimeType: dto.mimeType },
      include: { candidate: true },
    });
  }

  async removeDocument(id: string) {
    await this.findOneDocument(id);
    return this.prisma.document.delete({ where: { id } });
  }

  // ----- Portail apprenant: données du candidat connecté -----
  async getMySchedule(candidateId: string, from?: string, to?: string) {
    const c = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { promotionId: true },
    });
    if (!c?.promotionId) return [];
    const where: any = { promotionId: c.promotionId };
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) where.startAt.lte = new Date(to);
    }
    return this.prisma.session.findMany({
      where,
      include: { room: true },
      orderBy: { startAt: 'asc' },
    });
  }

  async getMyAbsences(candidateId: string, from?: string, to?: string) {
    const where: any = { candidateId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    return this.prisma.absence.findMany({
      where,
      include: { session: true },
      orderBy: { date: 'desc' },
    });
  }

  async getMyGrades(candidateId: string) {
    return this.prisma.grade.findMany({
      where: { candidateId },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyDocuments(candidateId: string, type?: string) {
    const where: any = { candidateId };
    if (type) where.type = type;
    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
