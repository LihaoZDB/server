import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { QianhaiService } from "./qianhai.service";
import { CreateQianhaiDto } from "./dto/create-qianhai.dto";
import { UpdateQianhaiDto } from "./dto/update-qianhai.dto";

@Controller("qianhai")
export class QianhaiController {
  constructor(private readonly qianhaiService: QianhaiService) {}

  @Post("getQuickPay")
  create(@Body() createQianhaiDto: CreateQianhaiDto) {
    return this.qianhaiService.getQuickPay(createQianhaiDto);
  }
}
