import { Controller, Post, Body } from "@nestjs/common";
import { TrackerService } from "./tracker.service";
import type {
  UvDto,
  PerformanceDto,
  PvDto,
  EventDto,
  ErrorDto,
  UpdateUvDto,
} from "@en/common/tracker";
@Controller("tracker")
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}
  @Post("uv")
  async uv(@Body() body: UvDto) {
    return this.trackerService.uv(body);
  }
  @Post("update-uv")
  async updateUv(@Body() body: UpdateUvDto) {
    return this.trackerService.updateUv(body);
  }
  @Post("performance")
  async performance(@Body() body: PerformanceDto) {
    return this.trackerService.performance(body);
  }
  @Post("pv")
  async pv(@Body() body: PvDto) {
    return this.trackerService.pv(body);
  }
  @Post("event")
  async event(@Body() body: EventDto) {
    return this.trackerService.event(body);
  }
  @Post("error")
  async error(@Body() body: ErrorDto) {
    return this.trackerService.error(body);
  }
}
