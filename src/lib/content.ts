import { PHOTOS } from "./images";

// Real photos and videos of a completed Straßmayr biomass heat generator installation.
export const INSTALLATION = {
  photos: [PHOTOS.wide, PHOTOS.container, PHOTOS.hopper, PHOTOS.hall],
  videos: [
    { src: "/video/install-walkaround.mp4", poster: "/video/install-walkaround.webp" },
    { src: "/video/install-exterior.mp4", poster: "/video/install-exterior.webp" },
  ],
} as const;

// Source: current gazdream.com product table (PUT line).
export const MODELS = [
  { name: "PUT-1,5", powerKw: "1000–1500", type: "mobile", burnerKw: 1500 },
  { name: "PUT-2,5", powerKw: "2000–2500", type: "mobile", burnerKw: 2500 },
  { name: "PUT-4", powerKw: "3000–4000", type: "mobile", burnerKw: 4000 },
  { name: "PUT-6", powerKw: "5000–6000", type: "mobile", burnerKw: 6000 },
] as const;

