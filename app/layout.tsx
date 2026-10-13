// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulador AFD | Herramienta de Análisis",
  description: "Plataforma interactiva para la simulación y análisis de Autómatas Finitos Deterministas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-300 selection:text-blue-900 min-h-screen transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}