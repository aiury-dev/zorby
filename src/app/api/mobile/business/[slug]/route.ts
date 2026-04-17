import { NextResponse } from "next/server";
import { getPublicBusinessBySlug } from "@/server/services/business";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const business = await getPublicBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        description: business.description,
        phone: business.phone,
        city: business.city,
        neighborhood: business.neighborhood,
        state: business.state,
        addressLine1: business.addressLine1,
        coverImageUrl: business.coverImageUrl,
        logoUrl: business.logoUrl,
        brandPrimaryColor: business.brandPrimaryColor,
        brandSecondaryColor: business.brandSecondaryColor,
        cancellationPolicyText: business.cancellationPolicyText,
        timezone: business.timezone,
        services: business.services,
        professionals: business.professionals,
        reviews: business.reviews,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar o negócio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
