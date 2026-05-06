/**
 * HTTP client for the **build-vs-buy Next.js app** (repo root, separate from this Worker).
 * Harry uses it as a tool; it is not part of the Worker bundle.
 *
 * Contract: `POST {CALCULATOR_BASE_URL}/api/scenarios` — see `src/app/api/scenarios/route.ts` in that app.
 */
export type PostScenarioBody = {
  sessionId: string;
  email?: string | null;
  /** Same numeric shape as `ScenarioInputs` in the Next app (`src/lib/tco.ts`). */
  inputs: Record<string, number>;
};

export type PostScenarioResponse = {
  id: string;
  reportUrl: string;
  verdict: string;
  emailQueued: boolean;
};

export async function postScenario(
  env: Pick<Env, "CALCULATOR_BASE_URL">,
  body: PostScenarioBody
): Promise<PostScenarioResponse> {
  const base = env.CALCULATOR_BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Calculator API ${res.status}: ${text}`);
  }
  return JSON.parse(text) as PostScenarioResponse;
}
