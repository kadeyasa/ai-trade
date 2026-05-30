import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/admin-settings";
import { hasSecret } from "@/lib/env";

export function getOpenAIClient() {
  const apiKey = getOpenAIKey();
  if (!hasSecret(apiKey)) return null;
  return new OpenAI({ apiKey });
}
