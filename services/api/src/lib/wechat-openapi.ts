/**
 * 微信云托管「开放接口服务」：在云托管容器内用 http 直连 api.weixin.qq.com，
 * 平台自动注入 access_token 并完成鉴权——既免去自管 token，也绕开 VPC 出网代理
 * 自签名证书导致的 TLS（self-signed certificate）报错。
 *
 * 仅在云托管线上生效，需在控制台开启「开放接口服务」，并设置环境变量
 * WECHAT_OPENAPI_PROXY=true。本地开发不设该变量，自动回退到 https + access_token。
 * @see https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html
 */
const WECHAT_API_HOST = "api.weixin.qq.com";

/** 是否走云托管开放接口服务（http 免鉴权通道）。 */
export const useWechatOpenApiProxy = (): boolean => process.env.WECHAT_OPENAPI_PROXY === "true";

/** 按当前环境拼接微信 OpenAPI 地址：代理模式用 http，否则用 https。 */
export const wechatOpenApiUrl = (path: string): URL =>
  new URL(`${useWechatOpenApiProxy() ? "http" : "https"}://${WECHAT_API_HOST}${path}`);
