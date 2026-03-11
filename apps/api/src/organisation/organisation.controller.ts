import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganisationService } from './organisation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@totem/database';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreateConventionDto } from './dto/create-convention.dto';
import { UpdateConventionDto } from './dto/update-convention.dto';

@ApiTags('organisation')
@ApiBearerAuth()
@Controller('organisation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.ADMISSION)
export class OrganisationController {
  constructor(private organisation: OrganisationService) {}

  // ----- Formations -----
  @Post('formations')
  @Roles(UserRole.ADMIN)
  createFormation(@Body() dto: CreateFormationDto) {
    return this.organisation.createFormation(dto);
  }

  @Get('formations')
  listFormations(@Query('activeOnly') activeOnly?: string) {
    return this.organisation.findAllFormations(activeOnly === 'true');
  }

  @Get('formations/:id')
  oneFormation(@Param('id') id: string) {
    return this.organisation.findOneFormation(id);
  }

  @Patch('formations/:id')
  @Roles(UserRole.ADMIN)
  updateFormation(@Param('id') id: string, @Body() dto: UpdateFormationDto) {
    return this.organisation.updateFormation(id, dto);
  }

  @Delete('formations/:id')
  @Roles(UserRole.ADMIN)
  removeFormation(@Param('id') id: string) {
    return this.organisation.removeFormation(id);
  }

  // ----- Promotions -----
  @Post('promotions')
  @Roles(UserRole.ADMIN)
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.organisation.createPromotion(dto);
  }

  @Get('promotions')
  listPromotions(
    @Query('formationId') formationId?: string,
    @Query('year') year?: string,
  ) {
    return this.organisation.findAllPromotions(
      formationId,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get('promotions/:id')
  onePromotion(@Param('id') id: string) {
    return this.organisation.findOnePromotion(id);
  }

  @Patch('promotions/:id')
  @Roles(UserRole.ADMIN)
  updatePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.organisation.updatePromotion(id, dto);
  }

  @Delete('promotions/:id')
  @Roles(UserRole.ADMIN)
  removePromotion(@Param('id') id: string) {
    return this.organisation.removePromotion(id);
  }

  // ----- Conventions -----
  @Post('conventions')
  createConvention(@Body() dto: CreateConventionDto) {
    return this.organisation.createConvention(dto);
  }

  @Get('conventions')
  listConventions(
    @Query('candidateId') candidateId?: string,
    @Query('companyId') companyId?: string,
    @Query('promotionId') promotionId?: string,
    @Query('status') status?: string,
  ) {
    return this.organisation.findAllConventions({
      candidateId,
      companyId,
      promotionId,
      status: status as any,
    });
  }

  @Get('conventions/:id')
  oneConvention(@Param('id') id: string) {
    return this.organisation.findOneConvention(id);
  }

  @Patch('conventions/:id')
  updateConvention(@Param('id') id: string, @Body() dto: UpdateConventionDto) {
    return this.organisation.updateConvention(id, dto);
  }

  @Delete('conventions/:id')
  @Roles(UserRole.ADMIN)
  removeConvention(@Param('id') id: string) {
    return this.organisation.removeConvention(id);
  }

  @Get('stats')
  organisationStats() {
    return this.organisation.getOrganisationStats();
  }
}
