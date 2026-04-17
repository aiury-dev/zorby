import { NextResponse } from "next/server";
import { rescheduleBookingWithToken } from "@/server/services/booking";
import { rescheduleBookingSchema } from "@/server/validators/public-booking";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = rescheduleBookingSchema.parse(await request.json());
    const result = await rescheduleBookingWithToken(token, body.startsAt, body.customerTimezone);

    return NextResponse.json({
      appointmentId: result.appointment.id,
      status: result.appointment.status,
      cancelToken: result.tokens.cancelToken,
      rescheduleToken: result.tokens.rescheduleToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel reagendar o agendamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
