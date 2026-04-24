export type ProductStatus = "enabled" | "disabled";

export type ProductNoticeLevel = "warn" | "error" | "info";

export type ProductNotice = {
  id: string;
  level: ProductNoticeLevel;
  text: string;
};

export type Product = {
  id: string;
  name: string;
  imageUrl: string;
  /** 详情页轮播图（至少 1 张） */
  heroImages: string[];
  /** 可选：标题强调文案（mini 端 titleAccent） */
  titleAccent: string;
  categoryId: string;
  categoryName: string;
  price: number;
  /** 可选：原价，用于详情页展示划线价 */
  originPrice: number | null;
  /** 可选：库存/活动文案（mini 端 stockText） */
  stockText: string;
  /** mini 端 badges */
  badges: string[];
  /** mini 端 descriptionLines */
  descriptionLines: string[];
  /** mini 端 notices */
  notices: ProductNotice[];
  status: ProductStatus;
  createdAt: string;
  createdBy: string;
};
