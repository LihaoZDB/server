import { Injectable } from "@nestjs/common";
import { PrismaService, ResponseService } from "@libs/shared";
import type {
  UvDto,
  PerformanceDto,
  PvDto,
  EventDto,
  ErrorDto,
  UpdateUvDto,
} from "@en/common/tracker";
@Injectable()
export class TrackerService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}
  async uv(body: UvDto) {
    // upsert 如果没有值就创建 如果有值就更新
    const visitor = await this.prismaService.visitor.upsert({
      where: { anonymousId: body.anonymousId },
      create: {
        anonymousId: body.anonymousId,
        userId: body.userId,
        browser: body.browser,
        os: body.os,
        device: body.device,
      },
      update: {
        userId: body.userId,
        browser: body.browser,
        os: body.os,
        device: body.device,
      },
      select: {
        id: true,
      },
    });
    return this.responseService.success(visitor.id);
  }
  async updateUv(body: UpdateUvDto) {
    if (!body.visitorId) return this.responseService.success(false);
    await this.prismaService.visitor.update({
      where: { id: body.visitorId },
      data: {
        userId: body.userId,
      },
    });
    return this.responseService.success(true);
  }
  async performance(body: PerformanceDto) {
    if (!body.visitorId) return this.responseService.success(false);
    await this.prismaService.performanceEntry.create({
      data: {
        visitorId: body.visitorId,
        fp: body.fp,
        fcp: body.fcp,
        lcp: body.lcp,
        inp: body.inp,
        cls: body.cls,
      },
    });
    return this.responseService.success(true);
  }
  async pv(body: PvDto) {
    if (!body.visitorId) return this.responseService.success(false);
    await this.prismaService.pageView.create({
      data: {
        visitorId: body.visitorId,
        url: body.url,
        referrer: body.referrer,
        path: body.path,
      },
    });
    return this.responseService.success(true);
  }
  async event(body: EventDto) {
    if (!body.visitorId) return this.responseService.success(false);
    await this.prismaService.trackEvent.create({
      data: {
        visitorId: body.visitorId,
        event: body.event,
        payload: body.payload,
        url: body.url,
      },
    });
    return this.responseService.success(true);
  }
  async error(body: ErrorDto) {
    if (!body.visitorId) return this.responseService.success(false);
    await this.prismaService.errorEntry.create({
      data: {
        visitorId: body.visitorId,
        error: body.error,
        message: body.message,
        stack: body.stack,
        url: body.url,
      },
    });
    return this.responseService.success(true);
  }
}
