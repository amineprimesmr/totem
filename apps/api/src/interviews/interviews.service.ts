import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterviewsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    matchId: string;
    date: Date;
    time?: string;
    location?: string;
    meetingUrl?: string;
    notes?: string;
  }) {
    await this.prisma.match.update({
      where: { id: data.matchId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });
    return this.prisma.interview.create({
      data: {
        matchId: data.matchId,
        date: data.date,
        time: data.time,
        location: data.location,
        meetingUrl: data.meetingUrl,
        notes: data.notes,
      },
      include: {
        match: {
          include: {
            candidate: { include: { user: true } },
            offer: { include: { company: true } },
          },
        },
      },
    });
  }

  async findByMatch(matchId: string) {
    return this.prisma.interview.findMany({
      where: { matchId },
      include: {
        match: {
          include: {
            candidate: { include: { user: true } },
            offer: { include: { company: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByCandidate(candidateId: string) {
    return this.prisma.interview.findMany({
      where: { match: { candidateId } },
      include: {
        match: {
          include: {
            offer: { include: { company: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: string, data: Partial<{ date: Date; time: string; location: string; meetingUrl: string; notes: string; status: string }>) {
    return this.prisma.interview.update({
      where: { id },
      data,
      include: {
        match: {
          include: {
            candidate: { include: { user: true } },
            offer: { include: { company: true } },
          },
        },
      },
    });
  }
}
