import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DynamicAI Builder",
    short_name: "DynamicAI",
    description: "Dynamic full-stack application runtime",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#2d6a4f",
    icons: []
  };
}
