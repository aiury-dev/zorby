import { BookingDiscoveryClient } from "@/components/public-booking/booking-discovery-client";
import { getDiscoverableBusinesses } from "@/server/services/business";

export default async function BookingDiscoveryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const initialCategory = typeof params.category === "string" ? params.category : "";
  const initialCity = typeof params.city === "string" ? params.city : "";

  const businesses = await getDiscoverableBusinesses(48);

  return (
    <BookingDiscoveryClient
      businesses={businesses}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      initialCity={initialCity}
    />
  );
}
