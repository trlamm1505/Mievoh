import { Global, Module } from '@nestjs/common';
import { BullModule as NestBullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';
import { DATABASE_REDIS } from '../../common/constant/app.constant';

@Global()
@Module({
  imports: [
    NestBullModule.forRoot({
      connection: new Redis(DATABASE_REDIS!, { maxRetriesPerRequest: null }) as any,
    }),
  ],
  exports: [NestBullModule],
})
export class BullSystemModule {}
