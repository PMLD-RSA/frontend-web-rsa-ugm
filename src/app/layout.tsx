import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const plusJakartaSans = localFont({
  src: "../../assets/UI/Plus_Jakarta_Sans/PlusJakartaSans-VariableFont_wght.ttf",
  variable: "--font-plus-jakarta-sans",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SI-POTA RSA UGM — Sistem Informasi Pemantauan Tangki Air",
  description: "Dashboard Monitoring & Early Warning Ketinggian Air Rumah Sakit Akademik UGM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
