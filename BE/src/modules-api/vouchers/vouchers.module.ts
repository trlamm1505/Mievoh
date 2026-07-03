import { Module } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { TokenModule } from '../../modules-system/token/token.module';

@Module({
  imports: [NotificationsModule, TokenModule],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
