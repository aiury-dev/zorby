import { NextResponse } from "next/server";
import { getDiscoverableBusinesses } from "@/server/services/business";

export async function GET() {
  try {
    const businesses = await getDiscoverableBusinesses(48);
    return NextResponse.json({ businesses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar a vitrine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
