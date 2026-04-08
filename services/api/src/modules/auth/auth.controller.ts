import { Body, Controller, Post } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type MiniLoginRequest = {
  code: string;
};

type MiniLoginResponse = {
  token: string;
  role: "user" | "worker";
};

@Controller("auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("mini/login")
  async miniLogin(@Body() body: MiniLoginRequest) {
    const code = body?.code?.trim();
    if (!code) {
      return {
        code: 400,
        message: "Missing code",
        data: null
      };
    }

    // DEV NOTE: In production, exchange code for openid/unionid via WeChat API.
    // For now, treat `code` as a stable openid placeholder to enable end-to-end flow.
    const openId = code;

    const existingUser = await this.prisma.user.findFirst({
      where: { wechatOpenId: openId },
      select: { id: true, role: true }
    });

    const user =
      existingUser ??
      (await this.prisma.user.create({
        data: {
          wechatOpenId: openId
        },
        select: { id: true, role: true }
      }));

    const response: MiniLoginResponse = {
      token: `dev-${user.id}`,
      role: user.role === "WORKER" ? "worker" : "user"
    };

    return {
      code: 0,
      message: "ok",
      data: response
    };
  }
}
