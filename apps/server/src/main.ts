import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common";
import { InterceptorInterceptor } from "@libs/shared/interceptor/interceptor";
import { InterceptorExceptionFilter } from "@libs/shared/interceptor/exceptionFilter";
import { Config } from "@en/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
