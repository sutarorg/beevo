import OpenAI from "openai";
import { requireEnv } from "@/lib/env";
import { estimateOpenAiCost } from "@/lib/pricing/provider-registry";

let cachedOpenAi: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY_VIOLATION: OpenAI client is strictly server-only.");
  }
  const apiKey = requireEnv("OPENAI_API_KEY", "OpenAI");
  if (!cachedOpenAi) {
    cachedOpenAi = new OpenAI({ apiKey });
  }
  return cachedOpenAi;
}

export interface StructuredResponseResult<T> {
  data: T;
  model: string;
  responseId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costInr: number;
  costSource: "actual" | "estimated";
}

/**
 * Calls the official OpenAI Responses API with Structured Outputs (JSON Schema, strict: true).
 * Returns parsed JSON plus exact input/output token counts for provider_usage accounting.
 */
export async function createStructuredOpenAiResponse<T>(params: {
  model: string;
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  temperature?: number;
}): Promise<StructuredResponseResult<T>> {
  const client = getOpenAiClient();

  const response = await client.responses.create({
    model: params.model,
    instructions: params.instructions,
    input: params.input,
    ...(typeof params.temperature === "number" ? { temperature: params.temperature } : {}),
    text: {
      format: {
        type: "json_schema",
        name: params.schemaName,
        strict: true,
        schema: params.schema,
      },
    },
  });

  const rawText = response.output_text;
  if (!rawText || rawText.trim().length === 0) {
    throw new Error(`OpenAI Responses API returned empty output for schema ${params.schemaName}.`);
  }

  let parsed: T;
  try {
    parsed = JSON.parse(rawText) as T;
  } catch (err) {
    throw new Error(
      `OpenAI structured output JSON parse failed for ${params.schemaName}: ${(err as Error).message}`
    );
  }

  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const cost = estimateOpenAiCost(params.model, inputTokens, outputTokens);

  return {
    data: parsed,
    model: params.model,
    responseId: response.id,
    inputTokens,
    outputTokens,
    costUsd: cost.costUsd,
    costInr: cost.costInr,
    costSource: cost.costSource,
  };
}
