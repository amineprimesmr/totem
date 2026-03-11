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
import { SchoolingService } from './schooling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@totem/database';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@ApiTags('schooling')
@ApiBearerAuth()
@Controller('schooling')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.ADMISSION)
export class SchoolingController {
  constructor(private schooling: SchoolingService) {}

  @Post('rooms')
  @Roles(UserRole.ADMIN)
  createRoom(@Body() dto: CreateRoomDto) {
    return this.schooling.createRoom(dto);
  }
  @Get('rooms')
  listRooms() {
    return this.schooling.findAllRooms();
  }
  @Get('rooms/:id')
  oneRoom(@Param('id') id: string) {
    return this.schooling.findOneRoom(id);
  }
  @Patch('rooms/:id')
  @Roles(UserRole.ADMIN)
  updateRoom(@Param('id') id: string, @Body() dto: Partial<CreateRoomDto>) {
    return this.schooling.updateRoom(id, dto);
  }
  @Delete('rooms/:id')
  @Roles(UserRole.ADMIN)
  removeRoom(@Param('id') id: string) {
    return this.schooling.removeRoom(id);
  }

  @Post('sessions')
  createSession(@Body() dto: CreateSessionDto) {
    return this.schooling.createSession(dto);
  }
  @Get('sessions')
  listSessions(
    @Query('promotionId') promotionId?: string,
    @Query('roomId') roomId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.schooling.findAllSessions({ promotionId, roomId, from, to });
  }
  @Get('sessions/:id')
  oneSession(@Param('id') id: string) {
    return this.schooling.findOneSession(id);
  }
  @Patch('sessions/:id')
  updateSession(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.schooling.updateSession(id, dto);
  }
  @Delete('sessions/:id')
  removeSession(@Param('id') id: string) {
    return this.schooling.removeSession(id);
  }

  @Post('absences')
  createAbsence(@Body() dto: CreateAbsenceDto) {
    return this.schooling.createAbsence(dto);
  }
  @Get('absences')
  listAbsences(
    @Query('candidateId') candidateId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.schooling.findAllAbsences({ candidateId, sessionId, from, to });
  }
  @Get('absences/:id')
  oneAbsence(@Param('id') id: string) {
    return this.schooling.findOneAbsence(id);
  }
  @Patch('absences/:id')
  updateAbsence(@Param('id') id: string, @Body() dto: UpdateAbsenceDto) {
    return this.schooling.updateAbsence(id, dto);
  }
  @Delete('absences/:id')
  removeAbsence(@Param('id') id: string) {
    return this.schooling.removeAbsence(id);
  }

  @Post('grades')
  createGrade(@Body() dto: CreateGradeDto) {
    return this.schooling.createGrade(dto);
  }
  @Get('grades')
  listGrades(
    @Query('candidateId') candidateId?: string,
    @Query('sessionId') sessionId?: string,
    @Query('subject') subject?: string,
  ) {
    return this.schooling.findAllGrades({ candidateId, sessionId, subject });
  }
  @Get('grades/:id')
  oneGrade(@Param('id') id: string) {
    return this.schooling.findOneGrade(id);
  }
  @Patch('grades/:id')
  updateGrade(@Param('id') id: string, @Body() dto: UpdateGradeDto) {
    return this.schooling.updateGrade(id, dto);
  }
  @Delete('grades/:id')
  removeGrade(@Param('id') id: string) {
    return this.schooling.removeGrade(id);
  }

  @Post('documents')
  createDocument(@Body() dto: CreateDocumentDto) {
    return this.schooling.createDocument(dto);
  }
  @Get('documents')
  listDocuments(
    @Query('candidateId') candidateId?: string,
    @Query('type') type?: string,
  ) {
    return this.schooling.findAllDocuments({ candidateId, type });
  }
  @Get('documents/:id')
  oneDocument(@Param('id') id: string) {
    return this.schooling.findOneDocument(id);
  }
  @Patch('documents/:id')
  updateDocument(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.schooling.updateDocument(id, dto);
  }
  @Delete('documents/:id')
  removeDocument(@Param('id') id: string) {
    return this.schooling.removeDocument(id);
  }
}
