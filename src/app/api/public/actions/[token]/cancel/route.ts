import { NextResponse } from "next/server";
import { cancelBookingWithToken } from "@/server/services/booking";
import { cancelBookingSchema } from "@/server/validators/public-booking";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = cancelBookingSchema.parse(await request.json());
    const appointment = await cancelBookingWithToken(token, body.reason);

    return NextResponse.json({
      appointmentId: appointment.id,
      status: appointment.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel cancelar o agendamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
