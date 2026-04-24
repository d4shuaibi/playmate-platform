import { request } from "./http";
import { apiPaths } from "./api-paths";

export type MiniProductCategory = {
  id: string;
  name: string;
};

export type MiniProductNotice = {
  id: string;
  level: "warn" | "error" | "info";
  text: string;
};

export type MiniProduct = {
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
  notices: MiniProductNotice[];
};

export const fetchMiniProductCategories = async () => {
  const res = await request<{ items: MiniProductCategory[]; total: number }>(
    apiPaths.miniProductCategories,
    { skipAuth: true }
  );
  return res.data.items;
};

export const fetchMiniProducts = async (params?: { keyword?: string; categoryId?: string }) => {
  const search = new URLSearchParams();
  if (params?.keyword?.trim()) search.set("keyword", params.keyword.trim());
  if (params?.categoryId?.trim()) search.set("categoryId", params.categoryId.trim());
  const query = search.toString();
  const path = query ? `${apiPaths.miniProducts}?${query}` : apiPaths.miniProducts;
  const res = await request<{ items: MiniProduct[]; total: number }>(path, { skipAuth: true });
  return res.data.items;
};

export const fetchMiniProductDetail = async (id: string) => {
  const res = await request<MiniProduct>(`${apiPaths.miniProducts}/${encodeURIComponent(id)}`, {
    skipAuth: true
  });
  return res.data;
};
