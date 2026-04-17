import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zorby",
    short_name: "Zorby",
    description: "Agendamento online para clinicas, saloes, barbearias e profissionais autonomos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1664e8",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
