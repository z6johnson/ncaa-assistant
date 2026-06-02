// Chat client for the TritonAI model hub (LiteLLM OpenAI-compatible proxy).
//
// Model: CHAT_MODEL_PRIMARY (default gpt-oss-120b), fallback CHAT_MODEL_FALLBACK.
// Purpose: turn retrieved verbatim bylaws into a grounded plain-English answer.
// Failure mode: timeout / rate limit / malformed output. Fallback: the API route
// degrades to retrieval-only (top bylaws + verbatim text). Never fabricates.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  model: string;
}

const PRIMARY = () => process.env.CHAT_MODEL_PRIMARY ?? "gpt-oss-120b";
const FALLBACK = () => process.env.CHAT_MODEL_FALLBACK ?? "gpt-5.5";

async function callOnce(model: string, messages: ChatMessage[]): Promise<ChatResult> {
  const baseUrl = requireEnv("TRITONAI_BASE_URL").replace(/\/$/, "");
  const apiKey = requireEnv("TRITONAI_API_KEY");
  const timeoutMs = Number(process.env.MODEL_TIMEOUT_MS ?? 30000);
  const maxTokens = Number(process.env.MODEL_MAX_TOKENS ?? 900);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      const err = new Error(`chat hub error ${res.status}: ${await res.text()}`);
      (err as Error & { retryable?: boolean }).retryable = retryable;
      throw err;
    }
    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) throw new Error("chat hub returned empty content");
    return { content, model };
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry(model: string, messages: ChatMessage[]): Promise<ChatResult> {
  const maxRetries = Number(process.env.MODEL_MAX_RETRIES ?? 2);
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callOnce(model, messages);
    } catch (err) {
      lastErr = err;
      const retryable = (err as Error & { retryable?: boolean }).retryable;
      if (!retryable || attempt === maxRetries) break;
      await sleep(2000 * 2 ** attempt);
    }
  }
  throw lastErr;
}

/** Try the primary model, then the fallback model once. Throws if both fail so
 *  the caller can degrade to retrieval-only. Errors are surfaced, not swallowed. */
export async function generateAnswer(messages: ChatMessage[]): Promise<ChatResult> {
  try {
    return await withRetry(PRIMARY(), messages);
  } catch (primaryErr) {
    try {
      return await withRetry(FALLBACK(), messages);
    } catch {
      throw primaryErr;
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
