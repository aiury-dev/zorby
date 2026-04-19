import { NextResponse } from "next/server";
import { buildCustomerSession } from "@/server/services/customer-auth";
import { signInWithGoogleIdToken } from "@/server/services/firebase-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken?.trim() ?? "";

    if (!idToken) {
      return NextResponse.json({ error: "Token do Google invalido." }, { status: 400 });
    }

    const session = await signInWithGoogleIdToken(idToken);
    return NextResponse.json(await buildCustomerSession(session));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel concluir o login com Google.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

