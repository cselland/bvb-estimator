export const MODEL_DATA = {
  "Claude 4.7 Opus": {
    coefficient: 1.0,
    provider: "Anthropic",
  },
  "GPT-5.5": {
    coefficient: 1.1,
    provider: "OpenAI",
  },
  "Microsoft Copilot (Enterprise)": {
    coefficient: 0.85,
    provider: "Microsoft",
  },
  "Claude 4.6 Sonnet": {
    coefficient: 0.6,
    provider: "Anthropic",
  },
  "Gemini 3.1 Pro": {
    coefficient: 0.5,
    provider: "Google",
  },
  "GPT-5.4 Mini": {
    coefficient: 0.15,
    provider: "OpenAI",
  },
  "Gemini 3 Flash": {
    coefficient: 0.1,
    provider: "Google",
  },
} as const;

export type ModelName = keyof typeof MODEL_DATA;
