import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

function resolveMetadataBase() {
  try {
    return new URL(process.env.APP_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
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
    <html
      lang="pt-BR"
      className={`h-full antialiased ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-full flex-col">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
