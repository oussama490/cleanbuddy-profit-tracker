import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Readex_Pro } from "next/font/google";
import type { ReactNode } from "react";
import { PrefsProvider } from "@/components/PrefsProvider";
import "./globals.css";

const readex = Readex_Pro({
  variable: "--font-readex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cleanbuddy",
  description: "Suivi personnel du profit Cleanbuddy",
  appleWebApp: {
    capable: true,
    title: "Cleanbuddy",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e131a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${readex.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("cb-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}var l=localStorage.getItem("cb-lang");if(l==="fr"){document.documentElement.lang="fr";document.documentElement.dir="ltr"}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}
