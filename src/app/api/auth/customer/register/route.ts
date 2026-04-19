import { NextResponse } from "next/server";
import { createFirebasePasswordUser, deleteFirebaseUser, signInWithFirebasePassword } from "@/server/services/firebase-auth";
import { buildCustomerSession } from "@/server/services/customer-auth";

function mapRegisterError(error: unknown) {
  const message = error instanceof Error ? error.message : "Nao foi possivel criar sua conta.";

  if (message.includes("email-already-exists")) {
    return "Ja existe uma conta com esse e-mail.";
  }

  if (message.includes("invalid-password")) {
    return "A senha informada nao atende aos requisitos do Firebase.";
  }

  return message;
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const phone = body.phone?.trim() ?? null;

    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail valido." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 8 caracteres." },
        { status: 400 },
      );
    }

    const user = await createFirebasePasswordUser({
      email,
      password,
      displayName: name,
    });
    createdUserId = user.uid;

    const session = await signInWithFirebasePassword(email, password);
    return NextResponse.json(await buildCustomerSession(session));
  } catch (error) {
    if (createdUserId) {
      await deleteFirebaseUser(createdUserId).catch(() => undefined);
    }

    return NextResponse.json({ error: mapRegisterError(error) }, { status: 400 });
  }
}

