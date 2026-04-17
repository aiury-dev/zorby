import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readBearerToken, verifyMobileToken } from "@/server/services/mobile-auth";

export async function GET(request: Request) {
  try {
    const token = verifyMobileToken(readBearerToken(request));
    if (!token) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [business, appointmentsToday, confirmedToday, revenueMonth, nextAppointments] = await Promise.all([
      prisma.business.findUnique({
        where: { id: token.businessId },
        select: {
          id: true,
          name: true,
          slug: true,
          onboardingStep: true,
          publicBookingEnabled: true,
          publicBookingPaused: true,
          logoUrl: true,
          coverImageUrl: true,
          brandPrimaryColor: true,
          city: true,
          state: true,
        },
      }),
      prisma.appointment.count({
        where: {
          businessId: token.businessId,
          startsAtUtc: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.appointment.count({
        where: {
          businessId: token.businessId,
          startsAtUtc: { gte: startOfDay, lte: endOfDay },
          status: "CONFIRMED",
        },
      }),
      prisma.appointment.aggregate({
        where: {
          businessId: token.businessId,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
          status: { not: "CANCELLED" },
        },
        _sum: { priceCents: true },
      }),
      prisma.appointment.findMany({
        where: {
          businessId: token.businessId,
          startsAtUtc: { gte: now },
        },
        orderBy: { startsAtUtc: "asc" },
        take: 6,
        select: {
          id: true,
          customerNameSnapshot: true,
          serviceNameSnapshot: true,
          startsAtUtc: true,
          status: true,
          professional: { select: { displayName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      business,
      summary: {
        appointmentsToday,
        confirmedToday,
        revenueMonthCents: revenueMonth._sum.priceCents ?? 0,
      },
      nextAppointments,
      user: {
        id: token.userId,
        name: token.name,
        email: token.email,
        role: token.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar o dashboard.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
