import { Module } from '@nestjs/common';
import { DigestService } from './digest.service';

@Module({
  providers: [DigestService]
})
export class DigestModule {}
