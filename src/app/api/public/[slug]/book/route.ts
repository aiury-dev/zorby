import { NextResponse } from "next/server";
import { createPublicBooking } from "@/server/services/booking";
import { publicBookingSchema } from "@/server/validators/public-booking";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const body = publicBookingSchema.parse(await request.json());

    const result = await createPublicBooking({
      slug,
      serviceId: body.serviceId,
      serviceVariantId: body.serviceVariantId,
      professionalId: body.professionalId,
      startsAt: body.startsAt,
      customerName: body.customerName,
      customerEmail: body.customerEmail || undefined,
      customerPhone: body.customerPhone,
      customerTimezone: body.customerTimezone,
    });

    return NextResponse.json({
      appointmentId: result.appointment.id,
      cancelToken: result.tokens.cancelToken,
      rescheduleToken: result.tokens.rescheduleToken,
      startsAt: result.appointment.startsAtUtc.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir o agendamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
