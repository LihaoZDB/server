import { Injectable, OnModuleInit } from "@nestjs/common";
import { CreateChatDto } from "./dto/create-chat.dto";
import {
  createDeepSeek,
  createCheckpoint,
  createBoChaSearch,
  createDeepSeekReasoner,
} from "../llm/llm.config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import type { ChatDto, ChatRoleType } from "@en/common/chat";
import type { AIMessageChunk, ReactAgent } from "langchain";
import { chatMode } from "../prompt/prompt.mode";
import { createAgent } from "langchain";
import { ResponseService } from "@libs/shared";
@Injectable()
export class ChatService implements OnModuleInit {
  constructor(private readonly responseService: ResponseService) {}
  private checkpointer: PostgresSaver;

  async onModuleInit() {
    // 1. 初始化checkpoint
    this.checkpointer = await createCheckpoint(); // 幂等性
  }

  async streamCompletion(createChatDto: ChatDto) {
    const promptObject = chatMode.find(
      (mode) => mode.role === createChatDto.role,
    );
    if (!promptObject) {
      throw new Error("模式不存在");
    }
    // 拿到基础的提示词
    let prompt = promptObject.prompt;
    // 如果开启了联网搜索增强提示词
    if (createChatDto.webSearch) {
      const webSearchPrompt = await createBoChaSearch(createChatDto.content);
      prompt += `请根据以下搜索结果回答问题：${webSearchPrompt}(并且返回参你参考的网站名称)，用户问题：${createChatDto.content}`;
    }
    // 默认是deepSeek模型
    let model = createDeepSeek();
    // 如果开启了深度思考模式使用deepSeekReasoner模型
    if (createChatDto.deepThink) {
      model = createDeepSeekReasoner();
    }
    const agent = await createAgent({
      model: model, // 模型
      systemPrompt: prompt, // 系统提示词
      checkpointer: this.checkpointer, // 检查点
    });
    if (!agent) {
      throw new Error("模式不存在");
    }
    const id = `${createChatDto.userId}-${createChatDto.role}`;
    const stream = agent.stream(
      {
        messages: [{ role: "human", content: createChatDto.content }],
      },
      {
        configurable: { thread_id: id }, // 会话隔离
        streamMode: "messages",
      },
    );
    return stream;
  }

  async findAll(userId: string, role: ChatRoleType) {
    const messages = await this.checkpointer.get({
      configurable: { thread_id: `${userId}-${role}` },
    });
    const list = messages?.channel_values?.messages as AIMessageChunk[];
    if (!list) return this.responseService.success([]);
    return this.responseService.success(
      list.map((item) => ({
        content: item.content,
        role: item.type,
        reasoning: item.additional_kwargs?.reasoning_content, // 返回深度思考的内容
      })),
    );
  }
}
