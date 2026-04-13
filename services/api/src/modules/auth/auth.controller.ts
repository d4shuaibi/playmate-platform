import { Body, Controller, Post } from "@nestjs/common";
import { AuthService, type MiniLoginRequest } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/mini/login
   * Body: `{ code }` 为 **getPhoneNumber** 返回的动态令牌；服务端换手机号后按手机号登录或**新建用户**。
   */
  @Post("mini/login")
  async miniLogin(@Body() body: MiniLoginRequest) {
    return this.authService.miniLogin(body);
  }
}
