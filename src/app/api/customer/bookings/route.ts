import { NextResponse } from "next/server";
import { verifyCustomerRequest } from "@/server/services/customer-auth";

export async function GET(request: Request) {
  try {
    await verifyCustomerRequest(request);
    return NextResponse.json({ bookings: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sessao invalida.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

