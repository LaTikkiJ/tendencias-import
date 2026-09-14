import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tendencias Import Perú",
  description: "Pacas Kids, Damas y series Kids.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
