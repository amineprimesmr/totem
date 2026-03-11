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
import { GaliaService, GaliaSyncResult, GaliaAnalyzeResult, GaliaImportType } from './galia.service';

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

  /**
   * Analyse un CSV (détection des colonnes, aperçu) sans importer.
   * Body: { type: 'candidates'|'companies'|'formations'|'promotions'|'absences'|'grades'|'documents', file ou csv }
   */
  @Post('analyze-csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['candidates', 'companies', 'formations', 'promotions', 'sessions', 'absences', 'grades', 'documents'] },
        csv: { type: 'string' },
      },
    },
  })
  async analyzeCsv(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('type') type: GaliaImportType,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaAnalyzeResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Envoie un fichier CSV ou le contenu (csv=...)');
    if (!type || !['candidates', 'companies', 'formations', 'promotions', 'sessions', 'absences', 'grades', 'documents'].includes(type)) {
      throw new BadRequestException('Paramètre type requis: candidates|companies|formations|promotions|sessions|absences|grades|documents');
    }
    return this.galia.analyzeCsv(type, csvContent);
  }

  @Post('import-formations')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importFormations(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaSyncResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Fichier CSV ou body csv requis');
    return this.galia.importFormationsFromCsv(csvContent);
  }

  @Post('import-promotions')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importPromotions(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaSyncResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Fichier CSV ou body csv requis');
    return this.galia.importPromotionsFromCsv(csvContent);
  }

  @Post('import-absences')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importAbsences(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaSyncResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Fichier CSV ou body csv requis');
    return this.galia.importAbsencesFromCsv(csvContent);
  }

  @Post('import-grades')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importGrades(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaSyncResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Fichier CSV ou body csv requis');
    return this.galia.importGradesFromCsv(csvContent);
  }

  @Post('import-documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importDocuments(
    @UploadedFile() file: { buffer?: Buffer } | undefined,
    @Body('csv') csvBody?: string,
  ): Promise<GaliaSyncResult> {
    const csvContent = file?.buffer?.toString('utf-8') ?? csvBody;
    if (!csvContent) throw new BadRequestException('Fichier CSV ou body csv requis');
    return this.galia.importDocumentsFromCsv(csvContent);
  }
}
