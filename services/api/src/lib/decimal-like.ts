/**
 * Prisma `Decimal` 与 API 层 `number` 互转（兼容 JSON 序列化后的普通数字）。
 */
export const decimalLikeToNumber = (value: unknown): number => {
  if (
    value !== null &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
