// Source: strasslider.com/kontakty. Sales is the main contact for product enquiries.
export const CONTACT = {
  phone: "+48 601 073 119",
  phoneHref: "tel:+48601073119",
  email: "sales@strasslider.com",
  officePhone: "+48 661 626 609",
  officePhoneHref: "tel:+48661626609",
  officeEmail: "office@strasslider.com",
} as const;

// Real photos and videos of a completed Straßmayr biomass heat generator installation.
export const INSTALLATION = {
  photos: [
    "/photos/install-wide.jpg",
    "/photos/install-container.jpg",
    "/photos/install-hopper.jpg",
    "/photos/install-hall.jpg",
  ],
  videos: [
    { src: "/video/install-walkaround.mp4", poster: "/video/install-walkaround.jpg" },
    { src: "/video/install-exterior.mp4", poster: "/video/install-exterior.jpg" },
  ],
} as const;

// Source: current gazdream.com product table (PUT line).
export const MODELS = [
  { name: "PUT-1,5", powerKw: "1000–1500", type: "mobile", burnerKw: 1500 },
  { name: "PUT-2,5", powerKw: "2000–2500", type: "mobile", burnerKw: 2500 },
  { name: "PUT-4", powerKw: "3000–4000", type: "stationary", burnerKw: 4000 },
  { name: "PUT-6", powerKw: "5000–6000", type: "stationary", burnerKw: 6000 },
] as const;

export type ProjectKey = "shostka" | "pereselenske" | "skrebyshi" | "buzovytsia" | "katowice" | "iziaslav";

// Source: "Діючі об'єкти" on gazdream.com. Client names are intentionally left out.
export const PROJECTS: {
  key: ProjectKey;
  powerMw: string;
  fuel: "chips" | "moist";
  dryer?: string;
  perDay?: string;
}[] = [
  { key: "shostka", powerMw: "5,0", fuel: "moist", perDay: "180–240" },
  { key: "pereselenske", powerMw: "5,0", fuel: "chips", dryer: "Comil", perDay: "350–400" },
  { key: "skrebyshi", powerMw: "6,0", fuel: "chips", dryer: "GSI-9000", perDay: "600" },
  { key: "buzovytsia", powerMw: "4,0", fuel: "chips", dryer: "Sukup", perDay: "400" },
  { key: "katowice", powerMw: "2,5", fuel: "chips" },
  { key: "iziaslav", powerMw: "5,0", fuel: "chips" },
];
