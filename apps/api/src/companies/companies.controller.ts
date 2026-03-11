import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, CompanyStatus } from '@totem/database';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private companies: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.companies.create({
      ...dto,
      status: dto.status as CompanyStatus | undefined,
      assignedToId: user.role === UserRole.COMMERCIAL ? user.id : dto.assignedToId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUser() user?: any,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (assignedTo) filters.assignedToId = assignedTo;
    if (search) filters.search = search;
    filters.page = Math.max(1, Number(page) || 1);
    filters.pageSize = Math.min(100, Math.max(1, Number(pageSize) || 25));
    if (user?.role === UserRole.COMMERCIAL && user.id) filters.assignedToId = user.id;
    return this.companies.findAll(filters);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  async export(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @CurrentUser() user?: any,
  ) {
    if (format !== 'csv') return res.status(400).json({ message: 'Format CSV uniquement' });
    const filters: any = {};
    if (status) filters.status = status;
    if (assignedTo) filters.assignedToId = assignedTo;
    if (user?.role === UserRole.COMMERCIAL && user.id) filters.assignedToId = user.id;
    const csv = await this.companies.exportCsv(filters);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="entreprises-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  one(@Param('id') id: string) {
    return this.companies.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companies.update(id, dto as any);
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  assign(@Param('id') id: string, @Body('userId') userId: string) {
    return this.companies.assignCommercial(id, userId);
  }
}
