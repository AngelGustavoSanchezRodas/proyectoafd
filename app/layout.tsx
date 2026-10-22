// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://proyectoafd.vercel.app"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Simulador de Autómatas Finitos Deterministas (AFD) | UMG",
    template: "%s | Simulador AFD",
  },
  description: "Simulador formal, pedagógico e interactivo de Autómatas Finitos Deterministas (AFD) con visualización de grafos de estados en tiempo real mediante Graphviz WebAssembly, ejecución paso a paso (Time-Travel) y análisis de cadenas.",
  keywords: [
    "Autómatas Finitos Deterministas",
    "AFD",
    "Simulador AFD",
    "Teoría de la Computación",
    "Lenguajes Formales",
    "Graphviz",
    "Graphviz Wasm",
    "Simulador de Autómatas",
    "UMG",
    "Universidad Mariano Gálvez"
  ],
  authors: [
    { name: "Angel Gustavo Sánchez Rodas" },
    { name: "Edith Aldana Gonzales" },
    { name: "Javier Alejandro Cruz Salvador" },
    { name: "Adelyn Alessandra Orellana Quiroz" },
    { name: "Joseph Raul Sánchez Portillo" },
    { name: "Brandon Gustavo Casasola Orellana" }
  ],
  creator: "Facultad de Ingeniería en Sistemas - Universidad Mariano Gálvez",
  publisher: "Universidad Mariano Gálvez de Guatemala",
  applicationName: "Simulador AFD",
  category: "education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Simulador de Autómatas Finitos Deterministas (AFD) | UMG",
    description: "Plataforma interactiva para diseñar, visualizar y simular Autómatas Finitos Deterministas en tiempo real con Graphviz WebAssembly.",
    url: "https://proyectoafd.vercel.app",
    siteName: "Simulador AFD UMG",
    locale: "es_GT",
    type: "website",
    images: [
      {
        url: "/icon.svg",
        width: 128,
        height: 128,
        alt: "Simulador de Autómatas Finitos Deterministas (AFD) UMG",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Simulador de Autómatas Finitos Deterministas (AFD)",
    description: "Herramienta interactiva para simular y analizar Autómatas Finitos Deterministas con visualización Graphviz en tiempo real.",
    images: ["/icon.svg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Simulador de Autómatas Finitos Deterministas (AFD)",
  url: "https://proyectoafd.vercel.app",
  description: "Herramienta web interactiva para la creación, visualización y simulación paso a paso de Autómatas Finitos Deterministas.",
  applicationCategory: "EducationalApplication",
  applicationSubCategory: "ComputerScienceApplication",
  operatingSystem: "All",
  browserRequirements: "Requires WebAssembly Support",
  inLanguage: "es",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "EducationalOrganization",
    name: "Universidad Mariano Gálvez de Guatemala",
    url: "https://umg.edu.gt",
  },
  featureList: [
    "Visualización de grafos de estados en tiempo real con Graphviz WebAssembly",
    "Simulación paso a paso con historial inmutable (Time-Travel)",
    "Editor reactivo de definiciones formales con validación sintáctica en vivo",
    "Matriz de transiciones delta y tabla de cadenas de prueba",
    "Soporte completo de modo oscuro y diseño responsive"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased selection:bg-blue-500/25 selection:text-blue-900 dark:selection:text-blue-200 min-h-screen overflow-x-hidden">
        {/* Enlace de accesibilidad para saltar directamente al contenido */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-md focus:text-xs focus:font-semibold"
        >
          Saltar al contenido principal
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}