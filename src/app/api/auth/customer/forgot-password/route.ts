import { NextResponse } from "next/server";
import { sendFirebasePasswordResetEmail } from "@/server/services/firebase-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail valido." }, { status: 400 });
    }

    await sendFirebasePasswordResetEmail(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel enviar o link de recuperacao.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

