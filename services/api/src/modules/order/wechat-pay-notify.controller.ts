import { Controller, HttpStatus, Logger, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
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

  /**
   * 成功须返回 2XX；验签/处理失败须返回 5XX，微信才会按规则重试（最多 15 次）。
   * 参见：https://pay.weixin.qq.com/doc/v3/merchant/4012791902
   */
  @Post("notify")
  async handle(
    @Req() req: Request & { rawBody?: Buffer },
    @Res({ passthrough: true }) res: Response
  ) {
    const ack = () => {
      res.status(HttpStatus.OK);
      return { code: "SUCCESS", message: "成功" };
    };
    const retry = (message: string) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return { code: "FAIL", message };
    };

    try {
      const rawText =
        typeof req.rawBody !== "undefined"
          ? req.rawBody.toString("utf8")
          : JSON.stringify(req.body ?? {});
      this.logger.log(`收到微信支付通知回调，body 长度=${rawText.length}`);
      const headers = req.headers as IncomingHttpHeaders;
      if (!this.wechatPayService.verifyNotifySignature(headers, rawText)) {
        return retry("验签失败");
      }

      const notify = JSON.parse(rawText) as NotifyEnvelope;
      this.logger.log(`支付通知 event_type=${notify.event_type ?? "(空)"}`);

      // 非支付成功事件（如退款通知等）直接确认，避免无意义重试
      if (notify.event_type !== "TRANSACTION.SUCCESS") {
        return ack();
      }

      const resource = notify.resource;
      if (!resource) {
        return retry("缺少 resource");
      }

      const plain = this.wechatPayService.decryptNotifyResource(resource);
      if (!plain) {
        this.logger.warn("支付通知解密失败");
        return retry("解密失败");
      }

      const tradeState = typeof plain.trade_state === "string" ? plain.trade_state : "";
      const outTradeNo = typeof plain.out_trade_no === "string" ? plain.out_trade_no : "";
      const wxTx = typeof plain.transaction_id === "string" ? plain.transaction_id : undefined;

      // 解出的交易状态非成功（如已关闭）：业务上无需处理，确认即可
      if (tradeState !== "SUCCESS" || !outTradeNo) {
        this.logger.warn(`通知状态非成功或缺少单号：${JSON.stringify(plain)}`);
        return ack();
      }

      await this.orderService.markMiniOrderPaidFromNotify(outTradeNo, wxTx);
      this.logger.log(`支付通知已处理，订单 ${outTradeNo} 标记为已支付`);
      return ack();
    } catch (e) {
      this.logger.warn(`处理支付通知异常：${e instanceof Error ? e.message : String(e)}`);
      return retry("处理失败");
    }
  }
}
