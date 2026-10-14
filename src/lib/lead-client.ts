export type LeadPayload = {
  name: string;
  contact: string;
  message?: string;
  model?: string;
  calc?: string;
  lang: string;
  page?: string;
  website?: string; // honeypot, must stay empty
};

/** Posts a lead to /api/lead. Resolves true only when the server confirmed delivery. */
export async function postLead(payload: LeadPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
