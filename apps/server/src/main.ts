import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common";
import { InterceptorInterceptor } from "@libs/shared/interceptor/interceptor";
import { InterceptorExceptionFilter } from "@libs/shared/interceptor/exceptionFilter";
import { Config } from "@en/config";
import { ConfigService } from "@nestjs/config";
import { RedisIoAdapter } from "./socket/redis-io.adapter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  app.useGlobalInterceptors(new InterceptorInterceptor());
  app.useGlobalFilters(new InterceptorExceptionFilter());
  app.setGlobalPrefix("api"); // 设置全局路由前缀
  app.enableVersioning({
    type: VersioningType.URI, // 版本控制类型，使用URI版本控制
    defaultVersion: "1", // 默认版本号v1
  });
  await app.listen(Config.ports.server);
}
bootstrap();
