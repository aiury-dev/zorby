import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

function getFirebaseApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY nao configurada.");
  }

  return apiKey;
}

export type FirebaseIdentitySession = {
  localId: string;
  email?: string;
  displayName?: string;
  idToken: string;
  refreshToken: string;
};

async function postIdentityToolkit<T>(endpoint: string, payload: Record<string, unknown>) {
  const apiKey = getFirebaseApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  const json = (await response.json()) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Nao foi possivel autenticar.");
  }

  return json;
}

export async function signInWithFirebasePassword(email: string, password: string) {
  const json = await postIdentityToolkit<Partial<FirebaseIdentitySession>>("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });

  if (!json.localId || !json.idToken || !json.refreshToken) {
    throw new Error("Credenciais invalidas.");
  }

  return json as FirebaseIdentitySession;
}

export async function signInWithGoogleIdToken(idToken: string) {
  const json = await postIdentityToolkit<Partial<FirebaseIdentitySession>>("accounts:signInWithIdp", {
    postBody: `id_token=${idToken}&providerId=google.com`,
    requestUri: "https://zorby.app/auth/google",
    returnIdpCredential: true,
    returnSecureToken: true,
  });

  if (!json.localId || !json.idToken || !json.refreshToken) {
    throw new Error("Nao foi possivel concluir o login com Google.");
  }

  return json as FirebaseIdentitySession;
}

export async function refreshFirebasePasswordSession(refreshToken: string) {
  const apiKey = getFirebaseApiKey();
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const json = (await response.json()) as {
    user_id?: string;
    id_token?: string;
    refresh_token?: string;
    error?: { message?: string };
  };

  if (!response.ok || !json.user_id || !json.id_token || !json.refresh_token) {
    throw new Error(json.error?.message ?? "Nao foi possivel renovar a sessao.");
  }

  return {
    localId: json.user_id,
    idToken: json.id_token,
    refreshToken: json.refresh_token,
  };
}

export async function sendFirebasePasswordResetEmail(email: string) {
  await postIdentityToolkit("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
  });
}

export async function createFirebasePasswordUser(input: {
  uid?: string;
  email: string;
  password: string;
  displayName?: string | null;
}) {
  const auth = getFirebaseAdminAuth();

  return auth.createUser({
    uid: input.uid,
    email: input.email,
    password: input.password,
    displayName: input.displayName ?? undefined,
    emailVerified: false,
  });
}

export async function ensureFirebaseGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const auth = getFirebaseAdminAuth();

  try {
    return await auth.getUserByEmail(input.email);
  } catch {
    return auth.createUser({
      email: input.email,
      displayName: input.name ?? undefined,
      photoURL: input.image ?? undefined,
      emailVerified: true,
    });
  }
}

export async function deleteFirebaseUser(uid: string) {
  const auth = getFirebaseAdminAuth();
  await auth.deleteUser(uid);
}
