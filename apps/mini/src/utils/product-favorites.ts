import Taro from "@tarojs/taro";

/** 本地持久化收藏商品 ID 列表的存储键（后端收藏接口就绪后可迁移） */
const STORAGE_KEY = "playmate.mini.productFavoriteIds";

/** 从存储读取 ID 列表 */
const readIds = (): string[] => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY) as unknown;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
};

/** 写入 ID 列表 */
const writeIds = (ids: string[]): void => {
  Taro.setStorageSync(STORAGE_KEY, ids);
};

/** 当前商品是否已被本地收藏 */
export const isFavoriteProductId = (productId: string): boolean => {
  if (!productId) {
    return false;
  }
  return readIds().includes(productId);
};

/**
 * 切换本地收藏状态。
 * @returns 切换后是否为已收藏
 */
export const toggleFavoriteProductId = (productId: string): boolean => {
  if (!productId) {
    return false;
  }
  const ids = readIds();
  const index = ids.indexOf(productId);
  if (index >= 0) {
    ids.splice(index, 1);
    writeIds(ids);
    return false;
  }
  writeIds([...ids, productId]);
  return true;
};
