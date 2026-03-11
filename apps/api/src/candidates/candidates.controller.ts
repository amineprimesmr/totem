import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@totem/database';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import * as bcrypt from 'bcrypt';

@ApiTags('candidates')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(
    private candidates: CandidatesService,
    private users: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION)
  async create(@Body() dto: CreateCandidateDto, @CurrentUser() user: any) {
    if (dto.email && dto.password) {
      const hashed = await bcrypt.hash(dto.password, 10);
      const created = await this.users.create({
        email: dto.email,
        password: hashed,
        name: dto.name,
        role: 'CANDIDATE',
        candidate: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          formation: dto.formation,
          city: dto.city,
          postalCode: dto.postalCode,
          sectors: dto.sectors,
          desiredJob: dto.desiredJob,
          contractType: dto.contractType as any,
          searchRadiusKm: dto.searchRadiusKm,
        },
      });
      return created.candidate;
    }
    if (!dto.userId) throw new Error('userId ou (email + password) requis');
    const payload = {
      ...dto,
      userId: dto.userId,
      assignedToId: user.role === UserRole.ADMISSION ? user.id : dto.assignedToId,
      availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
    };
    return this.candidates.create(payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @Query('status') status?: string,
    @Query('formation') formation?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUser() user?: any,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (formation) filters.formation = formation;
    if (assignedTo) filters.assignedToId = assignedTo;
    if (search) filters.search = search;
    filters.page = Math.max(1, Number(page) || 1);
    filters.pageSize = Math.min(100, Math.max(1, Number(pageSize) || 25));
    if (user?.role === UserRole.ADMISSION && user.id) filters.assignedToId = user.id;
    return this.candidates.findAll(filters);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION)
  async export(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('status') status?: string,
    @Query('formation') formation?: string,
    @Query('assignedTo') assignedTo?: string,
    @CurrentUser() user?: any,
  ) {
    if (format !== 'csv') return res.status(400).json({ message: 'Format CSV uniquement' });
    const filters: any = {};
    if (status) filters.status = status;
    if (formation) filters.formation = formation;
    if (assignedTo) filters.assignedToId = assignedTo;
    if (user?.role === UserRole.ADMISSION && user.id) filters.assignedToId = user.id;
    const csv = await this.candidates.exportCsv(filters);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="candidats-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  one(@Param('id') id: string) {
    return this.candidates.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.candidates.update(id, { status: dto.status as any });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION)
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidates.update(id, dto as any);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMISSION)
  assign(@Param('id') id: string, @Body('userId') userId: string) {
    return this.candidates.assignTo(id, userId);
  }
}
