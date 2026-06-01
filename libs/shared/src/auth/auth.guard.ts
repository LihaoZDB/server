import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";
import type { RefreshTokenPayload } from "@en/common/user";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers; // 读取请求头
    if (!headers.authorization) {
      throw new UnauthorizedException("No token provided"); //401
    }
    const token = headers.authorization.split(" ")[1];

    try {
      const decoded = this.jwtService.verify<RefreshTokenPayload>(token);
      if (decoded.tokenType !== "access") {
        throw new UnauthorizedException("token已过期或无效"); //401
      }
      request.user = decoded; // 将用户信息存储在请求对象的自定义属性中
      return true;
    } catch (error) {
      throw new UnauthorizedException("Token is invalid"); //401
    }
  }
}

//web -> axios -> 请求 -> guard(通过之后) -> controller -> service -> *** -> response
