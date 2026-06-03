import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import type {
  Token,
  UserUpdate,
  UserLogin,
  UserRegister,
} from "@en/common/user";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "@libs/shared/auth/auth.guard";
import type { Request } from "express";
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("login")
  login(@Body() createUserDto: UserLogin) {
    return this.userService.login(createUserDto);
  }

  @Post("register")
  register(@Body() CreateUserDto: UserRegister) {
    return this.userService.register(CreateUserDto);
  }

  @Post("refresh-token")
  refreshToken(@Body() CreateUserDto: Omit<Token, "accessToken">) {
    return this.userService.refreshToken(CreateUserDto);
  }

  @Post("upload-avatar")
  @UseInterceptors(FileInterceptor("file")) // 限制前端上传的key必须是file
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadAvatar(file);
  }

  @UseGuards(AuthGuard)
  @Post("update-user")
  updateUser(@Body() createUserDto: UserUpdate, @Req() req: Request) {
    const user = req.user;
    return this.userService.updateUser(createUserDto, user);
  }
}
