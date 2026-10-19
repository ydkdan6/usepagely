import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UsePagely",
    short_name: "UsePagely",
    description: "Read books anywhere",
    start_url: "/offline",
    display: "standalone",
    background_color: "#f1eee4",
    theme_color: "#f1eee4",
    icons: [
      { src: "/icon-192.png", sizes: "32x32", type: "image/png" },
      { src: "/usepagely-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
