import type { Metadata } from "next";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  applicationName: "Zorby",
  title: "Zorby",
  description: "SaaS de agendamento online para clinicas, saloes, barbearias e prestadores de servico.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
