import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import type { UserLogin, UserRegister } from "@en/common/user";

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
}
