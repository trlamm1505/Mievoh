import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsProcessor } from './processors/email-cron.processor';
import { AnalysisProcessor } from './processors/analysis-cron.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'email_cron_queue' },
      { name: 'analysis_cron_queue' }
    ),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RecommendationsProcessor, AnalysisProcessor],
})
export class RecommendationsModule {}
