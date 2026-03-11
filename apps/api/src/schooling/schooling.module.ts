import { Module } from '@nestjs/common';
import { SchoolingController } from './schooling.controller';
import { PortailController } from './portail.controller';
import { SchoolingService } from './schooling.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolingController, PortailController],
  providers: [SchoolingService],
  exports: [SchoolingService],
})
export class SchoolingModule {}
