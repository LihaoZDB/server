import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { ChatModule } from "./chat/chat.module";
import { PromptModule } from "./prompt/prompt.module";
import { SharedModule } from "@libs/shared";

@Module({
  imports: [ChatModule, PromptModule, SharedModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
