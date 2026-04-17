import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingExperience } from "@/components/public-booking/booking-experience";
import { getPublicBusinessBySlug } from "@/server/services/business";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    return {
      title: "Página não encontrada | Zorby",
    };
  }

  const location = [business.neighborhood, business.city].filter(Boolean).join(", ");
  const title = business.seoTitle || `${business.name}${location ? ` | ${location}` : ""} | Agendamento online`;
  const description =
    business.seoDescription ||
    business.description ||
    `Agende online com ${business.name}${location ? ` em ${location}` : ""}. Veja horários disponíveis em tempo real e confirme em poucos cliques.`;
  const image = business.coverImageUrl || business.logoUrl || `/${business.slug}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${business.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/${business.slug}`,
      type: "website",
      images: [{ url: image, alt: `Agendamento com ${business.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicBookingPage({ params }: Params) {
  const { slug } = await params;
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const averageRating = business.reviews.length
    ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / business.reviews.length
    : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": business.category === "HEALTH" ? "MedicalBusiness" : "LocalBusiness",
    name: business.name,
    image: business.coverImageUrl || business.logoUrl || undefined,
    telephone: business.phone || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.addressLine1 || undefined,
      addressLocality: business.city || undefined,
      addressRegion: business.state || undefined,
      postalCode: business.postalCode || undefined,
      addressCountry: business.country || "BR",
    },
    aggregateRating: averageRating
      ? {
          "@type": "AggregateRating",
          ratingValue: averageRating.toFixed(1),
          reviewCount: business.reviews.length,
        }
      : undefined,
    review: business.reviews.map((review) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
      },
      author: {
        "@type": "Person",
        name: review.customerNameSnapshot,
      },
      reviewBody: review.body || undefined,
    })),
  };

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,#eff6ff,transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-8 md:px-6 md:py-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-7xl">
        <BookingExperience
          slug={business.slug}
          timezone={business.timezone}
          name={business.name}
          description={business.description}
          phone={business.phone}
          city={business.city}
          neighborhood={business.neighborhood}
          cancellationPolicyText={business.cancellationPolicyText}
          services={business.services}
          professionals={business.professionals}
          reviews={business.reviews}
        />
      </div>
    </main>
  );
}
