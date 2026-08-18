import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import type { ReactNode } from "react";
import { PrefsProvider } from "@/components/PrefsProvider";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cleanbuddy",
  description: "Suivi personnel du profit Cleanbuddy",
  appleWebApp: {
    capable: true,
    title: "Cleanbuddy",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12211d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}
