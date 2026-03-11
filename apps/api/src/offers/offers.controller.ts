import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, OfferStatus } from '@totem/database';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@ApiTags('offers')
@ApiBearerAuth()
@Controller('offers')
export class OffersController {
  constructor(private offers: OffersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  create(@Body() dto: CreateOfferDto, @CurrentUser() user: any) {
    const companyId = dto.companyId ?? user.companyId;
    if (!companyId) return Promise.reject({ statusCode: 400, message: 'companyId requis' });
    return this.offers.create({
      ...dto,
      companyId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      status: dto.status as OfferStatus | undefined,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('sector') sector?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters: any = {};
    if (companyId) filters.companyId = companyId;
    if (status) filters.status = status;
    if (sector) filters.sector = sector;
    if (search) filters.search = search;
    filters.page = Math.max(1, Number(page) || 1);
    filters.pageSize = Math.min(100, Math.max(1, Number(pageSize) || 25));
    return this.offers.findAll(filters);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  async export(
    @Res() res: Response,
    @Query('format') format: string,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    if (format !== 'csv') return res.status(400).json({ message: 'Format CSV uniquement' });
    const filters: any = {};
    if (companyId) filters.companyId = companyId;
    if (status) filters.status = status;
    const csv = await this.offers.exportCsv(filters);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="offres-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  one(@Param('id') id: string) {
    return this.offers.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.offers.update(id, dto as any);
  }
}
