import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,#d8f3dc,transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eefbf4_100%)] px-6 py-20">
      <SignupForm />
    </main>
  );
}
