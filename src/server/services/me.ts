import { getAuthSession } from "@/lib/auth";
import { getPrimaryMembership } from "@/server/services/business";

export async function getCurrentMembership() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return null;
  }

  return getPrimaryMembership(session.user.id);
}
