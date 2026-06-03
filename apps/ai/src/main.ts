import { NestFactory } from "@nestjs/core";
import { AiModule } from "./ai.module";
import { InterceptorInterceptor } from "@libs/shared/interceptor/interceptor";
import { InterceptorExceptionFilter } from "@libs/shared/interceptor/exceptionFilter";
import { VersioningType } from "@nestjs/common";
import { Config } from "@en/config";

async function bootstrap() {
  const app = await NestFactory.create(AiModule);
  app.useGlobalInterceptors(new InterceptorInterceptor());
  app.useGlobalFilters(new InterceptorExceptionFilter());
  app.setGlobalPrefix("ai");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  await app.listen(Config.ports.ai);
}
bootstrap();
