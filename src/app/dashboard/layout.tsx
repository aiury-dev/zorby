import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentMembership } from "@/server/services/me";
import { getOnboardingStepPath } from "@/server/services/onboarding";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  if (membership.business.onboardingStep !== "COMPLETED") {
    redirect(getOnboardingStepPath(membership.business.onboardingStep));
  }

  const currentSubscription = membership.business.subscriptions[0];
  const subscriptionLabel = currentSubscription
    ? `${currentSubscription.plan.name} • ${currentSubscription.status.toLowerCase()}`
    : "Sem assinatura";

  return (
    <DashboardShell businessName={membership.business.name} subscriptionLabel={subscriptionLabel}>
      {children}
    </DashboardShell>
  );
}
