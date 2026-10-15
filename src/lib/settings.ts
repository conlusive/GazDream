import "server-only";
import { cacheTag } from "next/cache";
import { readSettings } from "@/lib/db/settings";
import { listVisibleProjects } from "@/lib/db/projects";
import { listVisibleTestimonials, type Testimonial } from "@/lib/db/testimonials";
import { SEED_PROJECTS, type ProjectFuel } from "@/lib/projects-seed";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings-schema";

// While `next build` prerenders pages there is no real database unless DATABASE_URL is set: use defaults
// then, instead of creating a throw-away database inside the build.
const buildingWithoutDb = () => process.env.NEXT_PHASE === "phase-production-build" && !process.env.DATABASE_URL;

export const SETTINGS_TAG = "settings";
export const TESTIMONIALS_TAG = "testimonials";
export const PROJECTS_TAG = "projects";

/**
 * Public-site settings, cached until the admin saves something (the save action expires the tag).
 * If the database cannot be reached the site keeps working on built-in defaults instead of failing.
 */
export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  if (buildingWithoutDb()) return DEFAULT_SETTINGS;
  try {
    return await readSettings();
  } catch (err) {
    console.error("Settings unavailable, using defaults:", err instanceof Error ? err.message : err);
    return DEFAULT_SETTINGS;
  }
}

export async function getTestimonials(lang: string): Promise<Testimonial[]> {
  "use cache";
  cacheTag(TESTIMONIALS_TAG);
  if (buildingWithoutDb()) return [];
  try {
    return await listVisibleTestimonials(lang);
  } catch (err) {
    console.error("Testimonials unavailable:", err instanceof Error ? err.message : err);
    return [];
  }
}

/** A project as the public page needs it: location already picked for the language. */
export type PublicProject = { id: number; location: string; powerMw: string; fuel: ProjectFuel; dryer: string; perDay: string };

const FALLBACK_PROJECTS = (lang: string): PublicProject[] =>
  SEED_PROJECTS.map((p, i) => ({
    id: -(i + 1),
    location: p.location[lang as keyof typeof p.location] || p.location.pl,
    powerMw: p.powerMw,
    fuel: p.fuel,
    dryer: p.dryer,
    perDay: p.perDay,
  }));

export async function getProjects(lang: string): Promise<PublicProject[]> {
  "use cache";
  cacheTag(PROJECTS_TAG);
  if (buildingWithoutDb()) return FALLBACK_PROJECTS(lang);
  try {
    const rows = await listVisibleProjects();
    return rows.map((r) => ({
      id: r.id,
      location: (r[`location_${lang}` as "location_pl"] || r.location_pl).trim(),
      powerMw: r.power_mw,
      fuel: r.fuel,
      dryer: r.dryer,
      perDay: r.per_day,
    }));
  } catch (err) {
    console.error("Projects unavailable, using the built-in list:", err instanceof Error ? err.message : err);
    return FALLBACK_PROJECTS(lang);
  }
}
