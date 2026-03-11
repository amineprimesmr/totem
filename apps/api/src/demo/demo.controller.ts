import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DemoService } from './demo.service';

@ApiTags('demo')
@Controller('demo')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ADMIN')
export class DemoController {
  constructor(private demo: DemoService) {}

  @Post('load')
  @ApiOperation({ summary: 'Charger les données d’exemple (candidats, entreprises, offres, matchs)' })
  loadDemo() {
    return this.demo.loadDemoData();
  }
}
