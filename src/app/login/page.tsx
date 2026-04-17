import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard/agenda";
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_24%),radial-gradient(circle_at_bottom_right,#bfdbfe_0%,transparent_18%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-10 md:px-6 md:py-16">
      <LoginForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </main>
  );
}
