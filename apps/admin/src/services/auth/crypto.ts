const toHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
};

const sha256Hex = async (value: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
};

export const buildPasswordProof = async (password: string, nonce: string) => {
  const passwordHash = await sha256Hex(password);
  return sha256Hex(`${passwordHash}.${nonce}`);
};
