import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard/agenda";

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-6 py-20">
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
