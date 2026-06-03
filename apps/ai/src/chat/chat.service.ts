import { Injectable, OnModuleInit } from "@nestjs/common";
import { CreateChatDto } from "./dto/create-chat.dto";
import { createDeepSeek, createCheckpoint } from "../llm/llm.config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { ChatDto, ChatRoleType } from "@en/common/chat";
import type { AIMessageChunk, ReactAgent } from "langchain";
import { chatMode } from "../prompt/prompt.mode";
import { createAgent } from "langchain";
import { ResponseService } from "@libs/shared";
@Injectable()
export class ChatService implements OnModuleInit {
  constructor(private readonly responseService: ResponseService) {}
  private checkpointer: PostgresSaver;
  private agents: Map<ChatRoleType, ReactAgent> = new Map();

  async onModuleInit() {
    // 1. 初始化checkpoint
    this.checkpointer = await createCheckpoint(); // 幂等性
    // 2. 创建多个agent
    for (const mode of chatMode) {
      const agent = createAgent({
        model: createDeepSeek(), // 模型
        systemPrompt: mode.prompt, // 系统提示词
        checkpointer: this.checkpointer, // 检查点
      });
      this.agents.set(mode.role, agent);
    }
  }

  streamCompletion(createChatDto: ChatDto) {
    const agent = this.agents.get(createChatDto.role);
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
      })),
    );
  }
}
