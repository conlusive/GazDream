import "server-only";
import { getDb } from "./index";

export type Testimonial = {
  id: number;
  lang: string; // "all" or a language code
  quote: string;
  author: string;
  role: string;
  location: string;
  visible: boolean;
  sort: number;
};

export const TESTIMONIAL_LANGS = ["all", "pl", "en", "de", "uk"] as const;

export async function listAllTestimonials(): Promise<Testimonial[]> {
  const db = await getDb();
  return db.query<Testimonial>("SELECT id, lang, quote, author, role, location, visible, sort FROM testimonials ORDER BY sort, id");
}

export async function listVisibleTestimonials(lang: string): Promise<Testimonial[]> {
  const db = await getDb();
  return db.query<Testimonial>(
    "SELECT id, lang, quote, author, role, location, visible, sort FROM testimonials WHERE visible AND (lang = 'all' OR lang = $1) ORDER BY sort, id",
    [lang],
  );
}

export type TestimonialInput = Omit<Testimonial, "id">;

export function validateTestimonial(i: Partial<TestimonialInput>): TestimonialInput {
  const quote = String(i.quote ?? "").trim();
  const author = String(i.author ?? "").trim();
  if (quote.length < 10 || quote.length > 600) throw new Error("Відгук має містити від 10 до 600 символів.");
  if (!author || author.length > 80) throw new Error("Вкажіть автора (до 80 символів).");
  const lang = String(i.lang ?? "all");
  if (!(TESTIMONIAL_LANGS as readonly string[]).includes(lang)) throw new Error("Невірна мова.");
  return {
    lang,
    quote,
    author,
    role: String(i.role ?? "").trim().slice(0, 80),
    location: String(i.location ?? "").trim().slice(0, 80),
    visible: i.visible !== false,
    sort: Number.isFinite(Number(i.sort)) ? Math.trunc(Number(i.sort)) : 0,
  };
}

export async function saveTestimonial(id: number | null, input: TestimonialInput) {
  const db = await getDb();
  if (id === null) {
    await db.query(
      "INSERT INTO testimonials (lang, quote, author, role, location, visible, sort) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [input.lang, input.quote, input.author, input.role, input.location, input.visible, input.sort],
    );
  } else {
    await db.query(
      "UPDATE testimonials SET lang=$2, quote=$3, author=$4, role=$5, location=$6, visible=$7, sort=$8 WHERE id=$1",
      [id, input.lang, input.quote, input.author, input.role, input.location, input.visible, input.sort],
    );
  }
}

export async function deleteTestimonial(id: number) {
  const db = await getDb();
  await db.query("DELETE FROM testimonials WHERE id = $1", [id]);
}
