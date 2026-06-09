import { Module, Global } from "@nestjs/common";
import { SharedService } from "./shared.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ResponseModule } from "./response/response.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MinioModule } from "./minio/minio.module";
import { PayModule } from "./pay/pay.module";
import { EmailModule } from "./email/email.module";

@Global()
@Module({
  providers: [SharedService, ConfigService],
  exports: [
    SharedService,
    PrismaModule,
    ResponseModule,
    JwtModule,
    ConfigModule,
    MinioModule,
    PayModule,
    EmailModule,
  ],
  imports: [
    PrismaModule,
    ResponseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>("SECRET_KEY"), // 密钥
          signOptions: { expiresIn: "1m" }, // 10s过期
        };
      },
    }),
    MinioModule,
    PayModule,
    EmailModule,
  ],
})
export class SharedModule {}
