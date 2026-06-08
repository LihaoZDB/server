import { Injectable } from "@nestjs/common";
import type { CreatePayDto } from "@en/common/pay";
import type { TokenPayload } from "@en/common/user";
import {
  PrismaService,
  PayService as SharedPayService,
  ResponseService,
} from "@libs/shared";
import * as nanoid from "nanoid";
import dayjs from "dayjs";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { TradeStatus } from "@libs/shared/generated/prisma/enums";
import { SocketGateway } from "../socket/socket.gateway";

@Injectable()
export class PayService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedPayService: SharedPayService,
    private readonly configService: ConfigService,
    private readonly socketGateway: SocketGateway,
    private readonly responseService: ResponseService,
  ) {}
  private createTradeNo() {
    const prifix = "XM";
    return `${prifix}-${nanoid.nanoid(12)}`;
  }
  async create(createPayDto: CreatePayDto, user: TokenPayload) {
    // 已经购买过的课程不可以重复购买
    const isPurchased = await this.prismaService.courseRecord.findFirst({
      where: {
        userId: user.userId,
        courseId: createPayDto.courseId,
      },
    });
    if (isPurchased) {
      return this.responseService.error(null, "您已经购买过该课程");
    }
    const result = await this.prismaService.$transaction(async (tx) => {
      // 1.创建订单表
      const outTradeNo = this.createTradeNo();
      await tx.paymentRecord.create({
        data: {
          userId: user.userId, // 用户ID
          outTradeNo, // 订单编号
          amount: createPayDto.total_amount, // 订单金额
          subject: createPayDto.subject, // 订单标题
          body: createPayDto.body, // 订单描述
        },
      });
      // 2.支付宝SDK发起支付宝URL
      const dateTime = dayjs().add(1, "minute"); // 当前的时间增加了一分钟，为了测试
      const payUrl = this.sharedPayService
        .getAlipaySdk()
        .pageExecute("alipay.trade.page.pay", "GET", {
          bizContent: {
            out_trade_no: outTradeNo,
            total_amount: createPayDto.total_amount,
            subject: createPayDto.subject,
            body: JSON.stringify({
              courseId: createPayDto.courseId,
              userId: user.userId,
            }),
            product_code: "FAST_INSTANT_TRADE_PAY", // 产品码
            time_expire: dateTime.format("YYYY-MM-DD HH:mm:ss"), // 订单过期时间
          },
          notify_url: `${this.configService.get<string>("ALIPAY_NOTIFY_URL")!}/api/v1/pay/notify`, // 通知地址
        });
      return {
        payUrl,
        timeExpire: dateTime.toDate().getTime(),
      };
    });
    return this.responseService.success(result);
  }

  async notify(req: Request) {
    const body = JSON.parse(req.body.body) as {
      courseId: string;
      userId: string;
    };
    await this.prismaService.$transaction(async (tx) => {
      // 1.更新支付记录
      const paymentRecord = await tx.paymentRecord.update({
        where: {
          outTradeNo: req.body.out_trade_no, // 订单编号
        },
        data: {
          tradeNo: req.body.trade_no, // 支付宝订单号
          tradeStatus: TradeStatus.TRADE_SUCCESS, // 支付状态
          sendPayTime: dayjs(req.body.gmt_payment).toDate(), // 支付时间
        },
      });
      // 2.创建我的课程
      await tx.courseRecord.create({
        data: {
          userId: body.userId,
          courseId: body.courseId,
          isPurchased: true, // 是否购买
          paymentRecordId: paymentRecord.id, // 支付记录ID
        },
      });
      // 通知前端socket
      this.socketGateway.emitPaymentSuccess(body.userId);
    });
    return true;
  }
}
