import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { GaliaController } from './galia.controller';
import { GaliaService } from './galia.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [GaliaController],
  providers: [GaliaService],
  exports: [GaliaService],
})
export class GaliaModule {}
