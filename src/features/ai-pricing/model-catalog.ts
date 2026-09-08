import type { AiModelPricing } from '@/lib/types';

export const AI_PROVIDERS = ['openai', 'anthropic', 'groq', 'google', 'mistral'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
  google: 'Google',
  mistral: 'Mistral',
};

/**
 * Reference list of current-ish model names per provider, so the calculator has
 * something to pick from beyond whatever's already priced. Provider lineups move
 * fast — treat this as a starting point, not a source of truth; a model missing
 * here can still be priced from the form above and will then show up everywhere
 * that reads AiModelPricing.
 */
export const KNOWN_MODELS: Record<AiProvider, string[]> = {
  openai: [
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'o3',
    'o3-mini',
    'o4-mini',
  ],
  anthropic: [
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
    'claude-opus-4-1',
    'claude-sonnet-4',
    'claude-3-7-sonnet',
    'claude-3-5-haiku',
  ],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  google: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  mistral: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
};

/** Every model this provider could plausibly have priced — the catalog plus anything already priced under it. */
export function modelsForProvider(provider: string, priced: AiModelPricing[]): string[] {
  const known = KNOWN_MODELS[provider as AiProvider] ?? [];
  const pricedForProvider = priced.filter(p => p.provider === provider).map(p => p.model);
  return [...new Set([...known, ...pricedForProvider])].sort();
}

/** "$X in · $Y cached · $Z out — per 1M tokens" for a priced model, or null if unpriced. */
export function priceHint(
  provider: string,
  model: string,
  priced: AiModelPricing[]
): string | null {
  const rate = priced.find(p => p.provider === provider && p.model === model);
  if (!rate) return null;
  const cached =
    rate.cachedInputPricePerMillionTokens === null
      ? ''
      : ` · $${rate.cachedInputPricePerMillionTokens.toFixed(2)} cached`;
  return `$${rate.inputPricePerMillionTokens.toFixed(2)} in${cached} · $${rate.outputPricePerMillionTokens.toFixed(2)} out — per 1M tokens`;
}
