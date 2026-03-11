import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [LocationModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
