import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bike Hub Stock",
    short_name: "Bike Hub",
    description: "Bike Hub stock tracker for staff",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F4F6F8",
    theme_color: "#0056A4",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

