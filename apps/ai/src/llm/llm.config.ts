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

// 初始化deepseekReasoner（深度思考）
export const createDeepSeekReasoner = () => {
  const configService = new ConfigService();
  return new ChatDeepSeek({
    apiKey: configService.get<string>("DEEPSEEK_API_KEY"),
    model: configService.get<string>("DEEPSEEK_REASONER_API_MODEL"),
    temperature: 1.3,
    maxTokens: 18000,
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

// 初始化博查api搜索
export const createBoChaSearch = async (query: string, count: number = 10) => {
  const configService = new ConfigService();
  const result = await fetch(configService.get<string>("BOCHA_API_URL")!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${configService.get<string>("BOCHA_API_KEY")}`,
    },
    body: JSON.stringify({
      query,
      count,
      summary: true, // 是否返回摘要
    }),
  });
  const { data } = await result.json();
  const values = data.webPages.value;
  const prompt: string = values
    .map(
      (item) => `
       标题：${item.name}
       链接：${item.url}
       摘要：${item.summary}
       网站名称：${item.siteName}
       发布时间：${item.dateLastCrawled}
    `,
    )
    .join("\n");
  return prompt;
};
