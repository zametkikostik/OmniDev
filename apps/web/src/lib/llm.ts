/**
 * OmniDev LLM Provider Layer
 *
 * Supports:
 * - OpenRouter (user can paste their own API / Management key)
 * - Ollama (local models)
 * - Direct OpenAI-compatible endpoints
 * - Anthropic-style (via adapter)
 * - Google AI Studio (OpenAI-compatible endpoint)
 */

export type LLMProviderType = 'openrouter' | 'ollama' | 'openai' | 'anthropic' | 'google' | 'custom';

export interface LLMConfig {
  provider: LLMProviderType;
  apiKey?: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompleteOptions {
  messages: ChatMessage[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  complete(options: LLMCompleteOptions): Promise<string>;
  completeJson<T = any>(options: LLMCompleteOptions): Promise<T>;
}

const DEFAULTS: Record<LLMProviderType, { baseURL: string; model: string }> = {
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-sonnet-4',
  },
  ollama: {
    baseURL: 'http://localhost:11434/v1',
    model: 'llama3.3',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4.1',
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
  },
  google: {
    // Google AI Studio OpenAI-compatible endpoint
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    // 2.5 blocked for NEW API keys — use 3.x
    model: 'gemini-3.6-flash',
  },
  custom: {
    baseURL: '',
    model: '',
  },
};

export class OpenAICompatibleProvider implements LLMProvider {
  private config: Required<Pick<LLMConfig, 'baseURL' | 'model'>> & LLMConfig;

  constructor(config: LLMConfig) {
    const defaults = DEFAULTS[config.provider] || DEFAULTS.custom;
    this.config = {
      ...config,
      baseURL: config.baseURL || defaults.baseURL,
      model: config.model || defaults.model,
    };
  }

  async complete(options: LLMCompleteOptions): Promise<string> {
    const url = `${this.config.baseURL.replace(/\/$/, '')}/chat/completions`;
    const body: any = {
      model: this.config.model,
      messages: options.messages,
      temperature: options.temperature ?? this.config.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 8192,
    };
    if (options.json) {
      body.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM ${res.status}: ${errText.slice(0, 500)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('LLM returned empty content');
    }
    return content;
  }

  async completeJson<T = any>(options: LLMCompleteOptions): Promise<T> {
    const raw = await this.complete({ ...options, json: true });
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned) as T;
  }
}

export function createLLMProvider(config: LLMConfig): LLMProvider {
  return new OpenAICompatibleProvider(config);
}

/** Admin UI — Google AI Studio (direct API, not OpenRouter) */
export const GOOGLE_AI_STUDIO_MODELS = [
  // GA 2026 — new API keys (2.5 blocked for new users)
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',
  // legacy (only if your key used them before)
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

export const OPENROUTER_POPULAR_MODELS = [
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4.1',
  'openai/gpt-4o',
  'google/gemini-3.6-flash',
  'google/gemini-3.5-flash',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat',
];
