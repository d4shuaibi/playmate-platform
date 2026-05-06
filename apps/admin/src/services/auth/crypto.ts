import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

const toHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * SHA-256(hex)。优先 WebCrypto（HTTPS / localhost）；在「非安全上下文」的 HTTP（如局域网 IP）
 * 下 `crypto.subtle` 不可用，改用 @noble/hashes。
 */
export const sha256Hex = async (value: string): Promise<string> => {
  const subtle = globalThis.crypto?.subtle;
  if (subtle && typeof subtle.digest === "function") {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const digest = await subtle.digest("SHA-256", data);
    return toHex(digest);
  }
  return bytesToHex(sha256(utf8ToBytes(value)));
};

export const buildPasswordProof = async (password: string, nonce: string) => {
  const passwordHash = await sha256Hex(password);
  return sha256Hex(`${passwordHash}.${nonce}`);
};
