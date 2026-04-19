import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { verifyCustomerRequest } from "@/server/services/customer-auth";

export async function POST(request: Request) {
  try {
    const decoded = await verifyCustomerRequest(request);
    await getFirebaseAdminAuth().revokeRefreshTokens(decoded.uid).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

