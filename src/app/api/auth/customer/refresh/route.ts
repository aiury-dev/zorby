import { NextResponse } from "next/server";
import { buildCustomerSession } from "@/server/services/customer-auth";
import { refreshFirebasePasswordSession } from "@/server/services/firebase-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { refreshToken?: string };
    const refreshToken = body.refreshToken?.trim() ?? "";

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token invalido." }, { status: 400 });
    }

    const session = await refreshFirebasePasswordSession(refreshToken);
    return NextResponse.json(await buildCustomerSession(session));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel renovar a sessao.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

