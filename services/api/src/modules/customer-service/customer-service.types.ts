export type CustomerServiceAgent = {
  id: string;
  nickname: string;
  wechatId: string;
  /** true 表示账号已禁用 */
  disabled: boolean;
  avatarUrl: string;
  wechatQrUrl: string;
  createdAt: string;
};
