import type { ScenarioTimelineEntry } from "./scenario-payload";
import type { ScenarioInputs, ScenarioResult } from "./tco";
import { generateSummaryMarkdown } from "./summary-report";

export type HarrySummaryOptions = {
  sessionId: string;
  inputs: ScenarioInputs;
  result: ScenarioResult;
  email: string | null;
  appName?: string;
  appDescription?: string;
  inputTimeline?: ScenarioTimelineEntry[];
  finalPrimaryTool?: string;
  finalSecondaryTool?: string;
};

export type GeneratedSummary = {
  markdown: string;
  source: "ai" | "fallback";
  error?: string;
};

type SummaryProvider = "gemini" | "openai" | "claude" | "custom";

type PromptPayload = {
  sessionId: string;
  appName: string | null;
  appDescription: string | null;
  verdict: string;
  horizonYears: number;
  buildThreeYearTco: number;
  saasThreeYearTco: number;
  modelNotes: {
    urgencyMultiplier: number;
    criticalityMultiplier: number;
    appetiteDiscount: number;
    saasCustomizationMultiplier: number;
  };
  chartData: ScenarioResult["chartData"];
  inputs: ScenarioInputs;
  inputTimeline: ScenarioTimelineEntry[];
  finalPrimaryTool: string | null;
  finalSecondaryTool: string | null;
  generatedAtIso: string;
};

function getProvider(): SummaryProvider {
  const raw = String(process.env.SUMMARY_PROVIDER || "gemini").toLowerCase().trim();
  if (raw === "openai" || raw === "claude" || raw === "custom") return raw;
  return "gemini";
}

function getOpenAiConfig(defaultBaseUrl: string, defaultModel: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL || defaultBaseUrl,
    model: process.env.OPENAI_MODEL || defaultModel,
  };
}

function fallbackSummary(opts: HarrySummaryOptions): string {
  return generateSummaryMarkdown(opts.sessionId, opts.inputs, opts.result, opts.email, {
    appName: opts.appName,
    appDescription: opts.appDescription,
    inputTimeline: opts.inputTimeline,
    finalPrimaryTool: opts.finalPrimaryTool,
    finalSecondaryTool: opts.finalSecondaryTool,
  });
}

function buildPromptPayload(opts: HarrySummaryOptions): PromptPayload {
  return {
    sessionId: opts.sessionId,
    appName: opts.appName ?? null,
    appDescription: opts.appDescription ?? null,
    verdict: opts.result.verdict,
    horizonYears: opts.result.horizonYears,
    buildThreeYearTco: opts.result.buildThreeYearTco,
    saasThreeYearTco: opts.result.saasThreeYearTco,
    modelNotes: {
      urgencyMultiplier: opts.result.urgencyMultiplier,
      criticalityMultiplier: opts.result.criticalityMultiplier,
      appetiteDiscount: opts.result.appetiteDiscount,
      saasCustomizationMultiplier: opts.result.saasCustomizationMultiplier,
    },
    chartData: opts.result.chartData,
    inputs: opts.inputs,
    inputTimeline: opts.inputTimeline ?? [],
    finalPrimaryTool: opts.finalPrimaryTool ?? null,
    finalSecondaryTool: opts.finalSecondaryTool ?? null,
    generatedAtIso: new Date().toISOString(),
  };
}

function buildUserPrompt(promptPayload: PromptPayload): string {
  return (
    "Create a markdown scenario analysis for a business executive audience in plain English. Keep it concise, practical, and free of jargon. " +
    "Always include these sections: Title, Application context, Executive summary, Recommendation with rationale, TCO comparison table, Key assumptions, Risks and sensitivities, Optional timeline highlights (if provided), and Next actions. " +
    "In the Application context section, explicitly use appName and appDescription from the JSON when provided. " +
    "Use concrete numbers from this JSON and stay consistent with the verdict. " +
    "Keep recommendations consistent with the calculator's slider/input helper guidance and built-in model assumptions (for example: urgency affects rush premium, criticality raises quality/resilience cost, higher self-coding appetite improves build velocity, and longer lifespan compounds SaaS economics). " +
    "State clearly that this is a basic summary based on the provided inputs and that benchmark context references patterns seen across organizations with similar build-vs-buy decisions. " +
    "End with this exact call to action sentence: For a deeper, more detailed briefing tailored to your specific evaluation, contact harry@differentialfactor.ai and we will gladly walk through your assumptions, benchmarks, and decision options.\n\n" +
    JSON.stringify(promptPayload)
  );
}

async function callOpenAiCompatible(
  cfg: { apiKey: string; baseUrl: string; model: string },
  promptPayload: PromptPayload,
): Promise<string> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are Harry, a pragmatic build-vs-buy analyst speaking to business executives. Write in plain English, concise and professional. " +
            "Do not use code fences. Do not fabricate data. Keep recommendations aligned with the calculator's helper-text assumptions. " +
            "If benchmark claims are qualitative, label them as directional benchmark context rather than exact external statistics.",
        },
        {
          role: "user",
          content: buildUserPrompt(promptPayload),
        },
      ],
    }),
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI summary generation failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI summary generation returned empty content");
  return content;
}

async function callClaude(promptPayload: PromptPayload): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.2,
      system:
        "You are Harry, a pragmatic build-vs-buy analyst speaking to business executives. Write in plain English, concise and professional. " +
        "Do not use code fences. Do not fabricate data. Keep recommendations aligned with the calculator's helper-text assumptions. " +
        "If benchmark claims are qualitative, label them as directional benchmark context rather than exact external statistics.",
      messages: [{ role: "user", content: buildUserPrompt(promptPayload) }],
    }),
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude summary generation failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((item) => item.type === "text")?.text?.trim();
  if (!text) throw new Error("Claude summary generation returned empty content");
  return text;
}

async function callCustom(promptPayload: PromptPayload): Promise<string> {
  const endpoint = process.env.CUSTOM_SUMMARY_URL;
  if (!endpoint) throw new Error("Missing CUSTOM_SUMMARY_URL");
  const apiKey = process.env.CUSTOM_SUMMARY_API_KEY;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      persona: "Harry",
      task: "build-vs-buy-summary",
      input: promptPayload,
    }),
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Custom summary generation failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { markdown?: string; content?: string; summary?: string };
  const out = (data.markdown || data.content || data.summary || "").trim();
  if (!out) throw new Error("Custom summary endpoint returned empty content");
  return out;
}

function shouldRetryError(message: string): boolean {
  return (
    /429/.test(message) ||
    /5\d\d/.test(message) ||
    /timed out|timeout|network|fetch failed|temporarily unavailable/i.test(message)
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      lastError = err;
      if (attempt >= maxAttempts || !shouldRetryError(err.message)) break;
      const delayMs = 350 * attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError ?? new Error("Unknown AI summary error");
}

export async function generateHarrySummaryMarkdown(opts: HarrySummaryOptions): Promise<GeneratedSummary> {
  const provider = getProvider();
  const promptPayload = buildPromptPayload(opts);

  const fallback = (error: string): GeneratedSummary => ({
    markdown: fallbackSummary(opts),
    source: "fallback",
    error,
  });

  try {
    if (provider === "claude") {
      const markdown = await withRetry(() => callClaude(promptPayload));
      return { markdown, source: "ai" };
    }
    if (provider === "custom") {
      const markdown = await withRetry(() => callCustom(promptPayload));
      return { markdown, source: "ai" };
    }

    if (provider === "openai") {
      const cfg = getOpenAiConfig("https://api.openai.com/v1", "gpt-4o-mini");
      if (!cfg) return fallback("Missing OpenAI configuration");
      const markdown = await withRetry(() => callOpenAiCompatible(cfg, promptPayload));
      return { markdown, source: "ai" };
    }

    // Default provider: Gemini via OpenAI-compatible endpoint.
    const cfg = getOpenAiConfig(
      "https://generativelanguage.googleapis.com/v1beta/openai",
      "gemini-2.5-flash",
    );
    if (!cfg) return fallback("Missing Gemini configuration");

    const markdown = await withRetry(() => callOpenAiCompatible(cfg, promptPayload));
    return { markdown, source: "ai" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fallback(message);
  }
}
