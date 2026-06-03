import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage } from "@langchain/core/messages";
import { ConfigService } from "@nestjs/config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

// 初始化deepseek
export const createDeepSeek = () => {
  const configService = new ConfigService();
  return new ChatDeepSeek({
    apiKey: configService.get<string>("DEEPSEEK_API_KEY"),
    model: configService.get<string>("DEEPSEEK_API_MODEL"),
    temperature: 1.3,
    maxTokens: 4396,
    streaming: true,
  });
};

// 初始化checkpoint
export const createCheckpoint = async () => {
  const configService = new ConfigService();
  const checkpointer = PostgresSaver.fromConnString(
    configService.get<string>("AI_DATABASE_URL")!,
  );
  await checkpointer.setup();
  return checkpointer;
};
