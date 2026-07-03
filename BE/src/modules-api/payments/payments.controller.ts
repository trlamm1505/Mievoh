import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('/vnpay-return')
  @Public()
  vnpayReturn(@Query() query: any) {
    return this.paymentsService.vnpayReturn(query);
  }

  @Get('/vnpay-ipn')
  @Public()
  vnpayIpn(@Query() query: any) {
    return this.paymentsService.vnpayIpn(query);
  }
}
