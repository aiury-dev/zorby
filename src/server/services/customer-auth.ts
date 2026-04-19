import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getUserByIdFromFirestore } from "@/server/services/firestore-read";
import { syncUserDocument } from "@/server/services/firebase-sync";
import type { FirebaseIdentitySession } from "@/server/services/firebase-auth";

type CustomerSession = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
};

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

export async function buildCustomerSession(identity: FirebaseIdentitySession): Promise<CustomerSession> {
  const auth = getFirebaseAdminAuth();
  const [firebaseUser, firestoreUser] = await Promise.all([
    auth.getUser(identity.localId),
    getUserByIdFromFirestore(identity.localId).catch(() => null),
  ]);

  const email = firebaseUser.email ?? firestoreUser?.email ?? identity.email ?? "";
  const name =
    firestoreUser?.name?.trim() ||
    firebaseUser.displayName?.trim() ||
    identity.displayName?.trim() ||
    email.split("@")[0] ||
    "Cliente";

  const phone = firestoreUser?.phone ?? firebaseUser.phoneNumber ?? null;
  const avatarUrl = firestoreUser?.image ?? firebaseUser.photoURL ?? null;

  await syncUserDocument({
    id: firebaseUser.uid,
    email,
    name,
    image: avatarUrl,
    phone,
  }).catch(() => undefined);

  return {
    token: identity.idToken,
    refreshToken: identity.refreshToken,
    user: {
      id: firebaseUser.uid,
      name,
      email,
      phone,
      avatarUrl,
    },
  };
}

export async function verifyCustomerRequest(request: Request) {
  const token = readBearerToken(request);

  if (!token) {
    throw new Error("Sessao invalida.");
  }

  return getFirebaseAdminAuth().verifyIdToken(token);
}

