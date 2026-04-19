import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await getFirebaseAdminDb().listCollections();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Healthcheck indisponivel.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
