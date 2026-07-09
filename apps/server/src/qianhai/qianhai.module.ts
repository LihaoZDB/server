import { Module } from '@nestjs/common';
import { QianhaiService } from './qianhai.service';
import { QianhaiController } from './qianhai.controller';

@Module({
  controllers: [QianhaiController],
  providers: [QianhaiService],
})
export class QianhaiModule {}
