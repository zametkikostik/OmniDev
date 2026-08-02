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
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-sonnet-4' },
  ollama: { baseURL: 'http://localhost:11434/v1', model: 'llama3.3' },
  openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4.1' },
  anthropic: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
  google: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
  },
  custom: { baseURL: '', model: '' },
};

export class OpenAICompatibleProvider implements LLMProvider {
  private config: Required<Pick<LLMConfig, 'baseURL' | 'model'>> & LLMConfig;

  constructor(config: LLMConfig) {
    const defaults = DEFAULTS[config.provider] || DEFAULTS.custom;
    this.config = {
      ...config,
      baseURL: config.baseURL || defaults.baseURL,
      model: config.model || defaults.model,
      temperature: config.temperature ?? 0.2,
      maxTokens: config.maxTokens ?? 8192,
    };
  }

  async complete(options: LLMCompleteOptions): Promise<string> {
    const body: any = {
      model: this.config.model,
      messages: options.messages,
      temperature: options.temperature ?? this.config.temperature,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
    };
    if (options.json) body.response_format = { type: 'json_object' };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;

    const res = await fetch(`${this.config.baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM ${res.status}: ${text.slice(0, 400)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('Empty LLM response');
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

export { GOOGLE_AI_STUDIO_MODELS, OPENROUTER_POPULAR_MODELS } from './models';
