import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cleanbuddy Profit Desk",
    short_name: "Cleanbuddy",
    description: "Personal COD and dropshipping profit tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#efe8dc",
    theme_color: "#12211d",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
