import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GaliaService, GaliaSyncResult } from './galia.service';

@ApiTags('integrations')
@Controller('integrations/galia')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ADMIN')
export class GaliaController {
  constructor(private galia: GaliaService) {}

  /**
   * Lance une synchronisation avec l'API Galia (si GALIA_API_URL et GALIA_API_TOKEN sont configurés).
   */
  @Get('sync')
  async sync(): Promise<GaliaSyncResult> {
    return this.galia.syncFromApi();
  }

  /**
   * Même chose en POST pour pouvoir être appelé depuis un cron ou un webhook.
   */
  @Post('sync')
  async syncPost(): Promise<GaliaSyncResult> {
    return this.galia.syncFromApi();
  }

  /**
   * Import candidats depuis un fichier CSV.
   * Colonnes attendues : email, firstName (ou prenom), lastName (ou nom), formation, city, externalId (ou id) ; optionnel : phone, postalCode.
   */
  @Post('import-candidates')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async importCandidates(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaSyncResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Envoie un fichier CSV ou le contenu CSV en body (csv=...)');
    return this.galia.importCandidatesFromCsv(csvContent);
  }

  /**
   * Import entreprises depuis un fichier CSV.
   * Colonnes : name (ou raisonSociale), sector, address, city, externalId (ou id) ; optionnel : phone, postalCode.
   */
  @Post('import-companies')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async importCompanies(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaSyncResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Envoie un fichier CSV ou le contenu CSV en body (csv=...)');
    return this.galia.importCompaniesFromCsv(csvContent);
  }
}
