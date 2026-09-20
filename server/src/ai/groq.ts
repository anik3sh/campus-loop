import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.startsWith('gsk_placeholder')) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export const DEFAULT_MODEL = 'qwen/qwen3.8-27b';
export const FALLBACK_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound-mini'];

export const GROQ_MODEL = () => process.env.GROQ_MODEL || DEFAULT_MODEL;

export async function groqChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { maxTokens?: number; temperature?: number; model?: string } = {}
): Promise<string> {
  const client = getGroqClient();
  const primaryModel = options.model || GROQ_MODEL();
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter(m => m !== primaryModel)];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        max_tokens: options.maxTokens || 1500,
        temperature: options.temperature ?? 0.7,
      });
      return completion.choices[0]?.message?.content || '';
    } catch (err: any) {
      lastError = err;
      const isModelError = err.status === 400 || err.status === 404 || err.message?.includes('model');
      if (isModelError && model !== modelsToTry[modelsToTry.length - 1]) {
        console.warn(`[Groq AI] Model '${model}' failed (${err.message}). Trying fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Groq AI models failed');
}
