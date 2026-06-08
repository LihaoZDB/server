import { Injectable, OnModuleInit } from "@nestjs/common";
import { AlipaySdk } from "alipay-sdk";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class PayService implements OnModuleInit {
  constructor(private configService: ConfigService) {}
  public alipaysdk: AlipaySdk;

  onModuleInit() {
    this.alipaysdk = new AlipaySdk({
      appId: this.configService.get<string>("ALIPAY_APP_ID")!,
      privateKey: this.configService.get<string>("ALIPAY_PRIVATE_KEY")!,
      alipayPublicKey: this.configService.get<string>("ALIPAY_PUBLIC_KEY")!,
      gateway: this.configService.get<string>("ALIPAY_GATEWAY")!,
    });
  }

  getAlipaySdk() {
    return this.alipaysdk;
  }
}
