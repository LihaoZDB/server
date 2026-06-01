import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import type { UserLogin, UserRegister } from "@en/common/user";
import { PrismaService, ResponseService } from "@libs/shared";
import type { Prisma } from "@libs/shared/generated/prisma/client";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import type { Token, RefreshTokenPayload } from "@en/common/user";
import { userSelect } from "./user.select";
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseService: ResponseService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}
  // 登录
  async login(createUserDto: UserLogin) {
    // 1. 判断手机号是否存在
    const user = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone },
    });
    if (!user) {
      return this.responseService.error(null, "手机号不存在");
    }
    // 2. 检查密码是否正确
    if (user.password !== createUserDto.password) {
      return this.responseService.error(null, "密码错误");
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
    // 4.生成token
    const token = this.authService.generateToken({
      userId: user.id,
      name: user.name,
      email: user.email,
    });
    return this.responseService.success({ ...updateUser, token });
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
      return this.responseService.error(null, "手机号已存在");
    }
    // 2. 判断一下邮箱是否传入，并且存在了也不行
    if (createUserDto.email) {
      const emailUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }, // 查询邮箱
      });
      if (emailUser) {
        return this.responseService.error(null, "邮箱已存在");
      }
      data.email = createUserDto.email;
    }
    // 3.创建用户 默认它是把所有的值全部返回的，包括密码 排除掉密码
    const newUser = await this.prisma.user.create({
      data,
      select: userSelect,
    });
    // 4.生成token
    const token = this.authService.generateToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
    return this.responseService.success({ ...newUser, token });
  }

  // 刷新令牌
  async refreshToken(createUserDto: Omit<Token, "accessToken">) {
    // 1. 验证refreshToken是否有效，verify检查token是否有效，并且返回解码后的数据， sign生成token
    try {
      const decoded = this.jwtService.verify<RefreshTokenPayload>(
        createUserDto.refreshToken,
      );
      // 2. 为什么增加一个判断 ？ 防止 accessToken 冒充 refreshToken进行攻击
      if (decoded.tokenType !== "refresh") {
        return this.responseService.error(null, "refreshToken已过期或无效");
      }
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      // 3. 如果查不出来说明userId是伪造的
      if (!user) {
        return this.responseService.error(null, "用户不存在");
      }
    } catch (error) {
      return this.responseService.error(null, "refreshToken已过期或无效");
    }
  }
}
