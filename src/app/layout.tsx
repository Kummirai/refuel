// src/app/layout.tsx - 
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jarkata = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jarkata",
});

export const metadata: Metadata = {
  title: "Kapuka - Driver Services",
  description: "Get fuel, cash & car wash instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jarkata.variable}>
      <body className={jarkata.className}>{children}</body>
    </html>
  );
}
