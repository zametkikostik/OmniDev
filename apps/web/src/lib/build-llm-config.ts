import type { LLMConfig } from './llm';

function platformEnvKey(provider: string): string | undefined {
  switch (provider) {
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
    case 'google':
      return process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    default:
      return undefined;
  }
}

function normalizeOllamaBase(url: string): string {
  let base = (url || 'http://localhost:11434').replace(/\/$/, '');
  if (!base.endsWith('/v1')) base = base + '/v1';
  return base;
}

const PLATFORM_PROVIDER = (process.env.PLATFORM_LLM_PROVIDER ||
  process.env.DEFAULT_LLM_PROVIDER ||
  'openrouter') as LLMConfig['provider'];
const PLATFORM_MODEL =
  process.env.PLATFORM_LLM_MODEL ||
  process.env.DEFAULT_LLM_MODEL ||
  (PLATFORM_PROVIDER === 'google'
    ? 'gemini-3.6-flash'
    : PLATFORM_PROVIDER === 'openai'
      ? 'gpt-4.1'
      : PLATFORM_PROVIDER === 'ollama'
        ? 'llama3.3'
        : 'anthropic/claude-sonnet-4');

export function allowUserByok(): boolean {
  return process.env.ALLOW_USER_BYOK === '1' || process.env.ALLOW_USER_BYOK === 'true';
}

function allowOllamaEnv(): boolean {
  return process.env.ALLOW_OLLAMA === '1' || process.env.ALLOW_OLLAMA === 'true';
}

export function buildLLMConfig(s?: any): LLMConfig {
  const byok = allowUserByok();
  const ollamaOk = allowOllamaEnv();

  if (byok && s?.activeProvider) {
    const cfg = fromClientSettings(s, ollamaOk);
    if (!cfg.apiKey && cfg.provider !== 'ollama') {
      cfg.apiKey = platformEnvKey(cfg.provider);
    }
    return cfg;
  }

  const provider =
    PLATFORM_PROVIDER === 'ollama' && !ollamaOk ? 'openrouter' : PLATFORM_PROVIDER;

  if (provider === 'ollama' && ollamaOk) {
    return {
      provider: 'ollama',
      baseURL: normalizeOllamaBase(
        process.env.OLLAMA_BASE_URL || process.env.DEFAULT_OLLAMA_URL || 'http://localhost:11434'
      ),
      model: process.env.OLLAMA_MODEL || PLATFORM_MODEL || 'llama3.3',
      apiKey: 'ollama',
    };
  }

  let cfg: LLMConfig;
  if (provider === 'google') {
    cfg = {
      provider: 'google',
      apiKey: platformEnvKey('google'),
      model: process.env.PLATFORM_LLM_MODEL || 'gemini-3.6-flash',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    };
  } else if (provider === 'openai') {
    cfg = {
      provider: 'openai',
      apiKey: platformEnvKey('openai'),
      model: process.env.PLATFORM_LLM_MODEL || 'gpt-4.1',
    };
  } else {
    cfg = {
      provider: 'openrouter',
      apiKey: platformEnvKey('openrouter'),
      model: process.env.PLATFORM_LLM_MODEL || PLATFORM_MODEL,
      baseURL: 'https://openrouter.ai/api/v1',
    };
  }

  if (!cfg.apiKey && s) {
    const client = fromClientSettings(s, ollamaOk);
    if (client.apiKey || client.provider === 'ollama') return client;
  }

  return cfg;
}

function fromClientSettings(s: any, ollamaOk: boolean): LLMConfig {
  switch (s.activeProvider) {
    case 'ollama':
      if (!ollamaOk) {
        return {
          provider: 'openrouter',
          apiKey: s.openRouterKey || platformEnvKey('openrouter'),
          model: s.openRouterModel || PLATFORM_MODEL,
        };
      }
      return {
        provider: 'ollama',
        baseURL: normalizeOllamaBase(
          s.ollamaBaseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
        ),
        model: s.ollamaModel || process.env.OLLAMA_MODEL || 'llama3.3',
        apiKey: 'ollama',
      };
    case 'openai':
      return {
        provider: 'openai',
        apiKey: s.openaiKey || platformEnvKey('openai'),
        model: s.openaiModel || 'gpt-4.1',
      };
    case 'google':
      return {
        provider: 'google',
        apiKey: s.googleApiKey || platformEnvKey('google'),
        model: s.googleModel || 'gemini-3.6-flash',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      };
    case 'custom':
      return {
        provider: 'custom',
        baseURL: s.customBaseURL,
        model: s.customModel,
        apiKey: s.customKey,
      };
    case 'openrouter':
    default:
      return {
        provider: 'openrouter',
        apiKey: s.openRouterKey || platformEnvKey('openrouter'),
        model: s.openRouterModel || PLATFORM_MODEL,
      };
  }
}

export function needsApiKey(config: LLMConfig): boolean {
  if (config.provider === 'ollama') return false;
  return !config.apiKey;
}

export function getPublicLlmInfo() {
  const provider = PLATFORM_PROVIDER === 'ollama' ? 'platform' : PLATFORM_PROVIDER;
  return {
    label: 'OmniDev AI',
    providerPublic:
      provider === 'openrouter' || provider === 'google' || provider === 'openai'
        ? provider
        : 'platform',
    modelPublic: process.env.SHOW_MODEL_NAME === '1' ? PLATFORM_MODEL : undefined,
    byokEnabled: allowUserByok(),
  };
}
