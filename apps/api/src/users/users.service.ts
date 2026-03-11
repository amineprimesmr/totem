import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@totem/database';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { candidate: true, company: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { candidate: true, company: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
    role: UserRole;
    candidate?: {
      firstName: string;
      lastName: string;
      phone?: string;
      formation: string;
      city: string;
      postalCode?: string;
      sectors?: string[];
      desiredJob?: string[];
      contractType?: string;
      searchRadiusKm?: number;
    };
    company?: {
      name: string;
      sector: string;
      address: string;
      city: string;
      postalCode?: string;
      phone?: string;
    };
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        name: data.name,
        role: data.role,
        candidate: data.candidate
          ? {
              create: {
                firstName: data.candidate.firstName,
                lastName: data.candidate.lastName,
                phone: data.candidate.phone,
                formation: data.candidate.formation,
                city: data.candidate.city,
                postalCode: data.candidate.postalCode,
                sectors: data.candidate.sectors ?? [],
                desiredJob: data.candidate.desiredJob ?? [],
                contractType: (data.candidate.contractType as any) ?? 'APPRENTICESHIP',
                searchRadiusKm: data.candidate.searchRadiusKm ?? 50,
              },
            }
          : undefined,
        company: data.company
          ? {
              create: {
                name: data.company.name,
                sector: data.company.sector,
                address: data.company.address,
                city: data.company.city,
                postalCode: data.company.postalCode,
                phone: data.company.phone,
              },
            }
          : undefined,
      },
      include: { candidate: true, company: true },
    });
  }

  async findAllSchoolUsers(role?: UserRole) {
    const where: any = {};
    const roles: UserRole[] = ['ADMIN', 'COMMERCIAL', 'ADMISSION'];
    if (role) where.role = role;
    else where.role = { in: roles };
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
