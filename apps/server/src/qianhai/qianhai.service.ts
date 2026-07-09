import { Injectable } from "@nestjs/common";
import { CreateQianhaiDto } from "./dto/create-qianhai.dto";
import { UpdateQianhaiDto } from "./dto/update-qianhai.dto";

@Injectable()
export class QianhaiService {
  getQuickPay(body: any) {
    console.log(body);

    return `This action returns a #${body.id} qianhai`;
  }
}
