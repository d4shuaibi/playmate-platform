import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

/**
 * SHA-256(hex)。管理端需在 HTTP/IP、内嵌 WebView 等「非安全上下文」下也可用，
 * 故统一用 @noble/hashes（不依赖 `crypto.subtle`，避免 `digest` of undefined）。
 */
export const sha256Hex = (value: string): string => {
  return bytesToHex(sha256(utf8ToBytes(value)));
};

/** proof = SHA256(SHA256(密码"."hex) + "." + nonce) — 与服务端校验一致 */
export const buildPasswordProof = (password: string, nonce: string): string => {
  const passwordHash = sha256Hex(password);
  return sha256Hex(`${passwordHash}.${nonce}`);
};
