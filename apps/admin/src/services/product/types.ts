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
  heroImages: string[];
  titleAccent: string;
  categoryId: string;
  categoryName: string;
  price: number;
  originPrice: number | null;
  stockText: string;
  badges: string[];
  descriptionLines: string[];
  notices: ProductNotice[];
  status: ProductStatus;
  createdAt: string;
  createdBy: string;
};
