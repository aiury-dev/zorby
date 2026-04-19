import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import {
  getAppointmentsForBusinessDateFromFirestore,
  getBusinessSettingsFromFirestore,
} from "@/server/services/firestore-read";
import { readBearerToken, verifyMobileToken } from "@/server/services/mobile-auth";

function buildDayBounds(date: string, timezone: string) {
  return {
    startUtc: fromZonedTime(`${date}T00:00:00`, timezone),
    endUtc: fromZonedTime(`${date}T23:59:59.999`, timezone),
  };
}

export async function GET(request: Request) {
  try {
    const token = verifyMobileToken(readBearerToken(request));
    if (!token) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const business = await getBusinessSettingsFromFirestore(token.businessId);

    const timezone = business?.timezone ?? "America/Sao_Paulo";
    const { startUtc, endUtc } = buildDayBounds(date, timezone);

    const appointments = await getAppointmentsForBusinessDateFromFirestore({
      businessId: token.businessId,
      startUtc,
      endUtc,
    });

    return NextResponse.json({ timezone, appointments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar a agenda.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
