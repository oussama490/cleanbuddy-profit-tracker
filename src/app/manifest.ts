import { dark, light } from "@/design/tokens";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cleanbuddy Profit Desk",
    short_name: "Cleanbuddy",
    description: "Personal COD and dropshipping profit tracker",
    start_url: "/",
    display: "standalone",
    background_color: light.background,
    theme_color: dark.ink,
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
