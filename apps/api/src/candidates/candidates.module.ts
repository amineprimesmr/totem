import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { QualificationService } from './qualification.service';
import { UsersModule } from '../users/users.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [UsersModule, LocationModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, QualificationService],
  exports: [CandidatesService, QualificationService],
})
export class CandidatesModule {}
