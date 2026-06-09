import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null; // 声明一个变量
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("EMAIL_HOST"),
      port: Number(this.configService.get<string>("EMAIL_PORT")),
      secure: !!Number(this.configService.get<string>("EMAIL_USE_SSL")),
      auth: {
        user: this.configService.get<string>("EMAIL_USER"),
        pass: this.configService.get<string>("EMAIL_PASSWORD"),
      },
    });

    this.sendEmail(
      "2572873054@qq.com",
      "Test Email",
      "This is a test email sent from NestJS.",
    );
  }

  /**
   * @param to 收件人邮箱
   * @param subject 邮件主题
   * @param text 邮件内容
   */
  async sendEmail(to: string, subject: string, text: string) {
    try {
      await this.transporter?.sendMail({
        from: this.configService.get<string>("EMAIL_FROM"),
        to,
        subject,
        html: text,
      });
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
}
