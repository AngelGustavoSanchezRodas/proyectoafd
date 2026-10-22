import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Simulador de Autómatas Finitos Deterministas (AFD) - UMG",
    short_name: "Simulador AFD",
    description: "Plataforma formal e interactiva para diseño, simulación y visualización de Autómatas Finitos Deterministas.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
