import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import type { UserLogin, UserRegister } from "@en/common/user";
import { PrismaService, ResponseService } from "@libs/shared";
import type { Prisma } from "@libs/shared/generated/prisma/client";

const userSelect = {
  id: true,
  phone: true,
  name: true,
  email: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  address: true,
  avatar: true,
  wordBookRecords: true,
  wordNumber: true,
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseService,
  ) {}
  // 登录
  async login(createUserDto: UserLogin) {
    // 1. 判断手机号是否存在
    const user = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone },
    });
    if (!user) {
      return this.response.error(null, "手机号不存在");
    }
    // 2. 检查密码是否正确
    if (user.password !== createUserDto.password) {
      return this.response.error(null, "密码错误");
    }
    // 3. 查询用户信息 更新最后登录时间
    const updateUser = await this.prisma.user.update({
      where: {
        id: user.id, // 查询用户id
      },
      data: {
        lastLoginAt: new Date(), // 最后登录时间
      },
      select: userSelect,
    });
    return this.response.success(updateUser);
  }

  // 注册  Prisma它所有的APi都是异步的
  async register(createUserDto: UserRegister) {
    const data: Prisma.UserCreateInput = {
      phone: createUserDto.phone,
      password: createUserDto.password,
      name: createUserDto.name,
      lastLoginAt: new Date(), // 最后登录时间
    };
    // findUnique返回单个数据
    // 1. 判断手机号是否已经存在
    const user = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone }, // 查询手机号
    });
    if (user) {
      return this.response.error(null, "手机号已存在");
    }
    // 2. 判断一下邮箱是否传入，并且存在了也不行
    if (createUserDto.email) {
      const emailUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }, // 查询邮箱
      });
      if (emailUser) {
        return this.response.error(null, "邮箱已存在");
      }
      data.email = createUserDto.email;
    }
    // 3.创建用户 默认它是把所有的值全部返回的，包括密码 排除掉密码
    const newUser = await this.prisma.user.create({
      data,
      select: userSelect,
    });

    return this.response.success(newUser);
  }
}
