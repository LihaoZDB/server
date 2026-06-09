import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@libs/shared";
import dayjs from "dayjs";
import { createAgent } from "langchain";
import { createDeepSeek } from "../llm/llm.config";
import { tool } from "@langchain/core/tools";

@Injectable()
export class DigestService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  private queryTool() {
    return tool(
      async ({ userId }: { userId: string }) => {
        const user = await this.prisma.user.findFirst({
          where: { id: userId },
          select: {
            email: true,
            name: true,
            wordNumber: true,
            wordBookRecords: {
              where: {
                createdAt: {
                  gte: dayjs().startOf("day").toDate(),
                  lte: dayjs().add(1, "day").startOf("day").toDate(),
                },
              },
              select: {
                word: {
                  select: {
                    word: true,
                  },
                },
              },
            },
          },
        });
        return user;
      },
      {
        name: "queryTool",
        description: "根据用户id查询用户学习的单词记录",
        schema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "用户id" },
          },
          required: ["userId"],
        },
      },
    );
  }

  async onModuleInit() {
    // 1.筛选高质量用户(打开定时任务 + 定时任务有时间 + 今天学过的单词 + 邮箱不为空)
    const userIds = await this.prisma.user.findMany({
      where: {
        isTimingTask: true, // 定时任务是否打开
        timingTaskTime: {
          not: "", // 定时任务时间不为空
        },
        email: { not: null }, // 邮箱不为空
        wordBookRecords: {
          // some :至少有一个满足 every: 全部都满足 none: 空的
          some: {
            createdAt: {
              gte: dayjs().startOf("day").toDate(), // 今天开始时间 >= 00:00:00
              lte: dayjs().add(1, "day").startOf("day").toDate(), // 明天开始时间 <= 00:00:00
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    for (const user of userIds) {
      const agent = createAgent({
        model: createDeepSeek(),
        tools: [this.queryTool()],
        systemPrompt:
          "你是一个单词记忆助手，根据用户信息和单词记录，生成单词记忆报告",
      });
      const result = await agent.invoke({
        messages: [
          {
            role: "user",
            content: `查询用户信息，并且根据用户id关联单词记录表，查询出用户今天的单词记录，用户id：${user.id}，过滤掉敏感信息`,
          },
        ],
      });
    }
    console.log(userIds, "=====");
  }
}
