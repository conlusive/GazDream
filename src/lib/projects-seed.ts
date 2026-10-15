// Built-in list of installations (source: "Діючі об'єкти" on gazdream.com, client names intentionally left out).
// It seeds the `projects` table (migration 4) and is the fallback while the database is unreachable.
export type ProjectFuel = "chips" | "moist";

export type SeedProject = {
  location: { pl: string; en: string; de: string; uk: string };
  powerMw: string;
  fuel: ProjectFuel;
  dryer: string;
  perDay: string;
};

export const SEED_PROJECTS: SeedProject[] = [
  {
    location: { pl: "Obwód sumski, Ukraina", en: "Sumy region, Ukraine", de: "Region Sumy, Ukraine", uk: "Сумська область, Україна" },
    powerMw: "5,0", fuel: "moist", dryer: "", perDay: "180–240",
  },
  {
    location: { pl: "Obwód kijowski, Ukraina", en: "Kyiv region, Ukraine", de: "Region Kiew, Ukraine", uk: "Київська область, Україна" },
    powerMw: "5,0", fuel: "chips", dryer: "Comil", perDay: "350–400",
  },
  {
    location: { pl: "Obwód kijowski, Ukraina", en: "Kyiv region, Ukraine", de: "Region Kiew, Ukraine", uk: "Київська область, Україна" },
    powerMw: "6,0", fuel: "chips", dryer: "GSI-9000", perDay: "600",
  },
  {
    location: { pl: "Obwód czerniowiecki, Ukraina", en: "Chernivtsi region, Ukraine", de: "Region Czernowitz, Ukraine", uk: "Чернівецька область, Україна" },
    powerMw: "4,0", fuel: "chips", dryer: "Sukup", perDay: "400",
  },
  {
    location: { pl: "Katowice, Polska", en: "Katowice, Poland", de: "Kattowitz, Polen", uk: "Катовіце, Польща" },
    powerMw: "2,5", fuel: "chips", dryer: "", perDay: "",
  },
  {
    location: { pl: "Obwód chmielnicki, Ukraina", en: "Khmelnytskyi region, Ukraine", de: "Region Chmelnyzkyj, Ukraine", uk: "Хмельницька область, Україна" },
    powerMw: "5,0", fuel: "chips", dryer: "", perDay: "",
  },
];
