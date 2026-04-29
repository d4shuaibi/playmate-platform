import { Controller, HttpCode, Logger, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import type { IncomingHttpHeaders } from "http";
import { OrderService } from "./order.service";
import { WechatPayService } from "./wechat-pay.service";

type NotifyEnvelope = {
  id?: string;
  event_type?: string;
  resource?: {
    algorithm?: string;
    ciphertext?: string;
    associated_data?: string;
    nonce?: string;
  };
};

/**
 * 微信支付结果异步通知（需在商户平台配置 notify_url 指向本接口）。
 * POST /api/wechat-pay/notify
 */
@Controller("wechat-pay")
export class WechatPayNotifyController {
  private readonly logger = new Logger(WechatPayNotifyController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly wechatPayService: WechatPayService
  ) {}

  @Post("notify")
  @HttpCode(200)
  handle(@Req() req: Request & { rawBody?: Buffer }) {
    try {
      const rawText =
        typeof req.rawBody !== "undefined"
          ? req.rawBody.toString("utf8")
          : JSON.stringify(req.body ?? {});
      const headers = req.headers as IncomingHttpHeaders;
      if (!this.wechatPayService.verifyNotifySignature(headers, rawText)) {
        return { code: "FAIL", message: "验签失败" };
      }

      const notify = JSON.parse(rawText) as NotifyEnvelope;

      if (notify.event_type !== "TRANSACTION.SUCCESS") {
        return { code: "SUCCESS", message: "成功" };
      }

      const resource = notify.resource;
      if (!resource) {
        return { code: "FAIL", message: "缺少 resource" };
      }

      const plain = this.wechatPayService.decryptNotifyResource(resource);
      if (!plain) {
        this.logger.warn("支付通知解密失败");
        return { code: "FAIL", message: "解密失败" };
      }

      const tradeState = typeof plain.trade_state === "string" ? plain.trade_state : "";
      const outTradeNo = typeof plain.out_trade_no === "string" ? plain.out_trade_no : "";
      const wxTx = typeof plain.transaction_id === "string" ? plain.transaction_id : undefined;

      if (tradeState !== "SUCCESS" || !outTradeNo) {
        this.logger.warn(`通知状态非成功或缺少单号：${JSON.stringify(plain)}`);
        return { code: "SUCCESS", message: "成功" };
      }

      this.orderService.markMiniOrderPaidFromNotify(outTradeNo, wxTx);
      return { code: "SUCCESS", message: "成功" };
    } catch (e) {
      this.logger.warn(`处理支付通知异常：${e instanceof Error ? e.message : String(e)}`);
      return { code: "FAIL", message: "处理失败" };
    }
  }
}
