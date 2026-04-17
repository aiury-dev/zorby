import { notFound } from "next/navigation";
import { ActionCard } from "@/components/public-booking/action-card";
import { loadActionTokenPreview } from "@/server/services/booking";

type Params = { params: Promise<{ token: string }> };

export default async function CancelBookingPage({ params }: Params) {
  try {
    const { token } = await params;
    const preview = await loadActionTokenPreview(token, "CANCEL");

    return (
      <main className="flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-12 md:px-6">
        <ActionCard
          kind="cancel"
          title="Cancelar agendamento"
          description="Se precisar cancelar, confirmamos a solicitacao imediatamente e avisamos o profissional."
          {...preview}
        />
      </main>
    );
  } catch {
    notFound();
  }
}
