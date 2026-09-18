import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tendencias Import Perú",
    template: "%s | Tendencias Import Perú",
  },
  description:
    "Pacas a pedido, ropa Kids y Series mayoristas de Tendencias Import Perú.",
  icons: {
    icon: [
      {
        url: "/logo-tendencias.png",
        type: "image/png",
      },
    ],
    shortcut: "/logo-tendencias.png",
    apple: "/logo-tendencias.png",
  },
  applicationName: "Tendencias Import Perú",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
