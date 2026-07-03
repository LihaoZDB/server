import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  All,
} from "@nestjs/common";
import { PayService } from "./pay.service";
import type { CreatePayDto } from "@en/common/pay";
import { AuthGuard } from "@libs/shared/auth/auth.guard";
import type { Request } from "express";

@Controller("pay")
export class PayController {
  constructor(private readonly payService: PayService) {}

  @UseGuards(AuthGuard)
  @Post("create")
  create(@Body() createPayDto: CreatePayDto, @Req() req: Request) {
    const user = req.user;
    user.userId;
    return this.payService.create(createPayDto, user);
  }

  @All("notify")
  notify(@Req() req: Request) {
    return this.payService.notify(req);
  }

  @UseGuards(AuthGuard)
  @Get("status/:outTradeNo")
  status(@Param("outTradeNo") outTradeNo: string) {
    return this.payService.getStatus(outTradeNo);
  }
}
