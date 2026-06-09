import { Injectable } from "@nestjs/common";
import { CreateLearnDto } from "./dto/create-learn.dto";
import { UpdateLearnDto } from "./dto/update-learn.dto";
import { PrismaService, ResponseService } from "@libs/shared";

@Injectable()
export class LearnService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}
  async getWordList(id: string, userId: string) {
    // 1.如果他没有购买过课程进入这个页面 非法请求
    const courseRecord = await this.prismaService.courseRecord.findFirst({
      where: {
        userId: userId,
        courseId: id,
      },
      include: {
        course: true,
      },
    });
    if (!courseRecord) {
      return this.responseService.error(null, "非法请求");
    }

    const courseType = courseRecord.course.value;
    const words = await this.prismaService.wordBook.findMany({
      where: {
        [courseType]: true, // 课程类型
        // 用户没有学习过这个单词本
        wordBookRecords: {
          none: {
            userId: userId, // 用户ID
          },
        },
      },
      skip: 0, // 跳过0条数据
      take: 10, // 获取10条数据
      orderBy: {
        frq: "desc", // 频率排序 越高越靠前
      },
    });

    return this.responseService.success(words);
  }

  async saveWordMaster(wordIds: string[], userId: string) {
    // 1.保存单词到wordBookRecord表
    const wordBookRecords = wordIds.map((wordId) => ({
      userId: userId,
      wordId: wordId,
      isMaster: true,
    }));
    await this.prismaService.wordBookRecord.createMany({
      data: wordBookRecords,
    });
    // 2. 更新用户学习单词的数量
    const user = await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        wordNumber: {
          increment: wordIds.length,
        },
      },
    });
    return this.responseService.success({
      wordNumber: user.wordNumber,
    });
  }
}
