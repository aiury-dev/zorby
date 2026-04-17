import { notFound } from "next/navigation";
import { ActionCard } from "@/components/public-booking/action-card";
import { loadActionTokenPreview } from "@/server/services/booking";

type Params = { params: Promise<{ token: string }> };

export default async function RescheduleBookingPage({ params }: Params) {
  try {
    const { token } = await params;
    const preview = await loadActionTokenPreview(token, "RESCHEDULE");

    return (
      <main className="flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-12 md:px-6">
        <ActionCard
          kind="reschedule"
          title="Reagendar agendamento"
          description="Escolha um novo horario disponivel. A confirmacao e feita na hora, sem precisar de login."
          {...preview}
        />
      </main>
    );
  } catch {
    notFound();
  }
}
