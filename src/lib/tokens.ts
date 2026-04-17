import crypto from "node:crypto";

const TOKEN_BYTES = 32;

export function createOpaqueToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
