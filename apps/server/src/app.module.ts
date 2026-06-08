import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { SharedModule } from '@libs/shared';
import { WordBookModule } from './word-book/word-book.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';
import { PayModule } from './pay/pay.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [UserModule, SharedModule, WordBookModule, AuthModule, CourseModule, PayModule, SocketModule],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
