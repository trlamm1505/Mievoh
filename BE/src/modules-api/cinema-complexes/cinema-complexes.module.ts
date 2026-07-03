import { Module } from '@nestjs/common';
import { CinemaComplexesService } from './cinema-complexes.service';
import { CinemaComplexesController } from './cinema-complexes.controller';

@Module({
  controllers: [CinemaComplexesController],
  providers: [CinemaComplexesService],
})
export class CinemaComplexesModule {}
