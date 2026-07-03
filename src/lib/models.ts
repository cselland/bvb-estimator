export const MODEL_DATA = {
  "Claude Opus 4.8": {
    coefficient: 1.2,
    provider: "Anthropic",
  },
  "GPT-4o": {
    coefficient: 0.85,
    provider: "OpenAI",
  },
  "Microsoft Copilot (Enterprise)": {
    coefficient: 0.80,
    provider: "Microsoft",
  },
  "Claude Sonnet 4.5": {
    coefficient: 0.55,
    provider: "Anthropic",
  },
  "Gemini 2.5 Pro": {
    coefficient: 0.50,
    provider: "Google",
  },
  "GPT-4o mini": {
    coefficient: 0.12,
    provider: "OpenAI",
  },
  "Gemini 2.5 Flash": {
    coefficient: 0.08,
    provider: "Google",
  },
  "Cursor": {
    coefficient: 0.45,
    provider: "Anysphere",
  },
  "Replit Agent": {
    coefficient: 0.30,
    provider: "Replit",
  },
  "Bolt.new": {
    coefficient: 0.28,
    provider: "StackBlitz",
  },
  "Lovable": {
    coefficient: 0.25,
    provider: "Lovable",
  },
  "v0 (Vercel)": {
    coefficient: 0.20,
    provider: "Vercel",
  },
} as const;

export type ModelName = keyof typeof MODEL_DATA;
