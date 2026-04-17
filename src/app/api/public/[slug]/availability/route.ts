import { NextResponse } from "next/server";
import { getAvailabilityForPublicBooking } from "@/server/services/booking";
import { availabilityQuerySchema } from "@/server/validators/public-booking";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const parsed = availabilityQuerySchema.parse({
      date: searchParams.get("date"),
      serviceId: searchParams.get("serviceId") ?? undefined,
      professionalId: searchParams.get("professionalId") ?? undefined,
      timezone: searchParams.get("timezone") ?? "America/Sao_Paulo",
    });

    if (!parsed.serviceId || !parsed.professionalId) {
      return NextResponse.json(
        { error: "Informe o serviço e o profissional para carregar os horários." },
        { status: 400 },
      );
    }

    const slots = await getAvailabilityForPublicBooking({
      slug,
      date: parsed.date,
      timezone: parsed.timezone,
      serviceId: parsed.serviceId,
      professionalId: parsed.professionalId,
    });

    return NextResponse.json({ slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar os horários.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
