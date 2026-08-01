/**
 * OmniDev LLM Provider Layer
 * OpenRouter, Ollama, OpenAI, Google AI Studio (Gemini), custom
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
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-3.5-sonnet' },
  ollama: { baseURL: 'http://localhost:11434/v1', model: 'llama3.1' },
  openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
  anthropic: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' },
  google: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
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
    if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    if (this.config.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://omnidev.app';
      headers['X-Title'] = 'OmniDev';
    }

    const res = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM error (${this.config.provider}): ${res.status} ${text}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from LLM');
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

export async function listOllamaModels(baseURL = 'http://localhost:11434'): Promise<string[]> {
  try {
    const res = await fetch(`${baseURL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: any) => m.name);
  } catch {
    return [];
  }
}

export const GOOGLE_AI_STUDIO_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-preview-05-20',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

export const OPENROUTER_POPULAR_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-pro-1.5',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-405b-instruct',
  'qwen/qwen-2.5-72b-instruct',
  'deepseek/deepseek-chat',
  'mistralai/mistral-large',
];
