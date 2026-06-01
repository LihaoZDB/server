import { Module, Global } from "@nestjs/common";
import { SharedService } from "./shared.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ResponseModule } from "./response/response.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  providers: [SharedService, ConfigService],
  exports: [
    SharedService,
    PrismaModule,
    ResponseModule,
    JwtModule,
    ConfigModule,
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
          signOptions: { expiresIn: "10" }, // 10s过期
        };
      },
    }),
  ],
})
export class SharedModule {}
