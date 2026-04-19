import { NextResponse } from "next/server";
import { buildCustomerSession } from "@/server/services/customer-auth";
import { signInWithFirebasePassword } from "@/server/services/firebase-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const session = await signInWithFirebasePassword(email, password);
    return NextResponse.json(await buildCustomerSession(session));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel entrar.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

