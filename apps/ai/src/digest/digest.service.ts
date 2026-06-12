import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@libs/shared";
import dayjs from "dayjs";
import { createAgent } from "langchain";
import { createDeepSeek } from "../llm/llm.config";
import { tool } from "@langchain/core/tools";
import marked from "marked";
import { Queue } from "bullmq"; // 类型
import { digestQueueName } from "./digest.queue";
import { InjectQueue } from "@nestjs/bullmq";

@Injectable()
export class DigestService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(digestQueueName.name) private readonly digestQueue: Queue,
  ) {}

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
    this.digestQueue.add(
      digestQueueName.task.everyDayDigest,
      {},
      { repeat: { pattern: "0 0 * * *" } },
    );
  }

  async handleEmailDigest() {
    // 1.筛选高质量用户(打开定时任务 + 定时任务有时间 + 今天学过的单词 + 邮箱不为空)
    const userIds = await this.prisma.user.findMany({
      where: {
        isTimingTask: true, // 定时任务是否打开
        AND: [
          { timingTaskTime: { not: null } }, // 定时任务时间不为null
          { timingTaskTime: { not: "" } }, // 定时任务时间不为空字符串
        ],
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
        email: true,
        timingTaskTime: true,
      },
    });

    console.log(`[DigestService] 查询到 ${userIds.length} 个符合条件的用户`);

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

      const content = result.messages.at(-1)?.content;

      if (content) {
        const html = await marked.parse(content as string);
        const [hour, minute, second] = user
          .timingTaskTime!.split(":")
          .map(Number);
        const target = dayjs()
          .startOf("day")
          .set("hour", hour)
          .set("minute", minute)
          .set("second", second);
        let delay = target.diff(dayjs());
        if (delay < 0) {
          delay = 0;
        }
        await this.digestQueue.add(
          digestQueueName.task.emailDigest,
          {
            userId: user.id,
            text: html,
            email: user.email,
          },
          {
            delay: delay,
          },
        );
      }

      console.log(`[DigestService] 已添加队列任务: userId=${user.id}`);
    }
  }
}
