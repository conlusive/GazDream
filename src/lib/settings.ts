import "server-only";
import { cacheTag } from "next/cache";
import { readSettings } from "@/lib/db/settings";
import { listVisibleTestimonials, type Testimonial } from "@/lib/db/testimonials";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings-schema";

// While `next build` prerenders pages there is no real database unless DATABASE_URL is set: use defaults
// then, instead of creating a throw-away database inside the build.
const buildingWithoutDb = () => process.env.NEXT_PHASE === "phase-production-build" && !process.env.DATABASE_URL;

export const SETTINGS_TAG = "settings";
export const TESTIMONIALS_TAG = "testimonials";

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
