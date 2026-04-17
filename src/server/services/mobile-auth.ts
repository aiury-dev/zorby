import crypto from "node:crypto";

export type MobileTokenPayload = {
  userId: string;
  businessId: string;
  role: string;
  name?: string | null;
  email: string;
  exp: number;
};

function getSecret() {
  return process.env.NEXTAUTH_SECRET ?? "zorby-mobile-secret";
}

function base64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function signSegment(segment: string) {
  return crypto.createHmac("sha256", getSecret()).update(segment).digest("base64url");
}

export function createMobileToken(payload: Omit<MobileTokenPayload, "exp">, ttlSeconds = 60 * 60 * 24 * 30) {
  const fullPayload: MobileTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const encoded = base64url(JSON.stringify(fullPayload));
  const signature = signSegment(encoded);
  return `${encoded}.${signature}`;
}

export function verifyMobileToken(token: string | null | undefined) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signSegment(encoded);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as MobileTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}
