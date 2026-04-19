import { NextResponse } from "next/server";
import {
  countAppointmentsFromFirestore,
  getAppointmentRevenueMonthCentsFromFirestore,
  getAppointmentsForBusinessDateFromFirestore,
  getBusinessSettingsFromFirestore,
  getUpcomingAppointmentsFromFirestore,
} from "@/server/services/firestore-read";
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

    const [business, appointmentsToday, confirmedToday, revenueMonthCents, nextAppointments] =
      await Promise.all([
        getBusinessSettingsFromFirestore(token.businessId),
        getAppointmentsForBusinessDateFromFirestore({
          businessId: token.businessId,
          startUtc: startOfDay,
          endUtc: endOfDay,
        }).then((items) => items.length),
        countAppointmentsFromFirestore({
          businessId: token.businessId,
          predicate: (appointment) =>
            appointment.startsAtUtc >= startOfDay &&
            appointment.startsAtUtc <= endOfDay &&
            appointment.status === "CONFIRMED",
        }),
        getAppointmentRevenueMonthCentsFromFirestore({
          businessId: token.businessId,
          monthStart: new Date(now.getFullYear(), now.getMonth(), 1),
        }),
        getUpcomingAppointmentsFromFirestore({
          businessId: token.businessId,
          startsAfter: now,
          limit: 6,
        }),
      ]);

    return NextResponse.json({
      business: business
        ? {
            id: business.id,
            name: business.name,
            slug: business.slug,
            onboardingStep: business.onboardingStep,
            publicBookingEnabled: business.publicBookingEnabled,
            publicBookingPaused: business.publicBookingPaused,
            logoUrl: business.logoUrl,
            coverImageUrl: business.coverImageUrl,
            brandPrimaryColor: business.brandPrimaryColor,
            city: business.city,
            state: business.state,
          }
        : null,
      summary: {
        appointmentsToday,
        confirmedToday,
        revenueMonthCents,
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
