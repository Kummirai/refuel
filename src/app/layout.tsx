// src/app/layout.tsx - 
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const jarkata = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jarkata",
});

export const metadata: Metadata = {
  title: "Kapuka Tradings",
  description: "Get fuel, cash & car wash instantly",
};

export const viewport: Viewport = {
  themeColor: "#3A7717",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jarkata.variable}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={jarkata.className}>
        {children}
        <PwaInstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/sw.js")
                    .then(function(reg) {
                      if (reg.installing) console.log("[PWA] SW installing");
                      else if (reg.waiting) console.log("[PWA] SW installed");
                      else if (reg.active) console.log("[PWA] SW active");
                    })
                    .catch(function(err) {
                      console.warn("[PWA] SW registration failed:", err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
