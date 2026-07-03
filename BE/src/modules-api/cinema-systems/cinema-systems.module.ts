import { Module } from '@nestjs/common';
import { CinemaSystemsService } from './cinema-systems.service';
import { CinemaSystemsController } from './cinema-systems.controller';

@Module({
  controllers: [CinemaSystemsController],
  providers: [CinemaSystemsService],
})
export class CinemaSystemsModule {}
