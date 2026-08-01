import type { LLMConfig } from './llm';

/** Build LLMConfig from client settings (OpenRouter / Google / Ollama / OpenAI / custom). */
export function buildLLMConfig(s?: any): LLMConfig {
  if (!s) {
    return { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' };
  }
  switch (s.activeProvider) {
    case 'ollama':
      return {
        provider: 'ollama',
        baseURL: `${(s.ollamaBaseURL || 'http://localhost:11434').replace(/\/$/, '')}/v1`,
        model: s.ollamaModel || 'llama3.1',
        apiKey: 'ollama',
      };
    case 'openai':
      return {
        provider: 'openai',
        apiKey: s.openaiKey,
        model: s.openaiModel || 'gpt-4o',
      };
    case 'google':
      return {
        provider: 'google',
        apiKey: s.googleApiKey,
        model: s.googleModel || 'gemini-2.0-flash',
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
        apiKey: s.openRouterKey,
        model: s.openRouterModel || 'anthropic/claude-3.5-sonnet',
      };
  }
}

export function needsApiKey(config: LLMConfig): boolean {
  if (config.provider === 'ollama') return false;
  return !config.apiKey;
}
