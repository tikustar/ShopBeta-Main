import type { MetadataRoute } from "next";
import {
  APP_DESCRIPTOR,
  APP_NAME,
  APP_TAGLINE,
  BRAND_THEME_COLOR,
} from "@/constants/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ${APP_DESCRIPTOR}`,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: BRAND_THEME_COLOR,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
