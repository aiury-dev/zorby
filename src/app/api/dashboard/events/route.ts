import { formatInTimeZone } from "date-fns-tz";
import { NextResponse } from "next/server";
import {
  getAppointmentStatusBreakdownFromFirestore,
  getAppointmentsForBusinessFromFirestore,
} from "@/server/services/firestore-read";
import { getCurrentMembership } from "@/server/services/me";

export const dynamic = "force-dynamic";

async function buildPayload(businessId: string, timezone: string) {
  const [recentAppointments, alertCounts] = await Promise.all([
    getAppointmentsForBusinessFromFirestore(businessId).then((items) =>
      [...items]
        .sort((left, right) => right.startsAtUtc.getTime() - left.startsAtUtc.getTime())
        .slice(0, 5),
    ),
    getAppointmentStatusBreakdownFromFirestore({
      businessId,
      createdAfter: new Date(Date.now() - 1000 * 60 * 60 * 24),
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    recentAppointments: recentAppointments.map((appointment) => ({
      id: appointment.id,
      customerName: appointment.customerNameSnapshot,
      serviceName: appointment.serviceNameSnapshot,
      status: appointment.status,
      startsAtLabel: formatInTimeZone(
        appointment.startsAtUtc,
        timezone,
        "dd/MM 'as' HH:mm",
      ),
    })),
    alerts: alertCounts.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.status] = item._count.status;
      return accumulator;
    }, {}),
  };
}

export async function GET() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const push = async () => {
        const payload = await buildPayload(membership.businessId, membership.business.timezone);
        controller.enqueue(encoder.encode(`event: dashboard\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      await push();
      interval = setInterval(() => {
        void push();
      }, 15000);
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
