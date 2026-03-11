import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@totem/database';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.ADMISSION)
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('kpis')
  kpis() {
    return this.dashboard.getKpis();
  }

  @Get('kpis/commercial')
  @Roles(UserRole.ADMIN, UserRole.COMMERCIAL)
  kpisCommercial(@CurrentUser() user: any) {
    return this.dashboard.getKpisForCommercial(user.id);
  }

  @Get('kpis/admission')
  @Roles(UserRole.ADMIN, UserRole.ADMISSION)
  kpisAdmission(@CurrentUser() user: any) {
    return this.dashboard.getKpisForAdmission(user.id);
  }

  @Get('funnel')
  funnel() {
    return this.dashboard.getFunnel();
  }

  @Get('map-data')
  mapData() {
    return this.dashboard.getMapData();
  }
}
