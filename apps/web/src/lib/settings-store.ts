export type ProviderPreference = 'openrouter' | 'ollama' | 'openai' | 'google' | 'custom';

export interface OmniDevSettings {
  openRouterKey: string;
  openRouterModel: string;
  ollamaBaseURL: string;
  ollamaModel: string;
  activeProvider: ProviderPreference;
  openaiKey: string;
  googleApiKey: string;
  googleModel: string;
  customBaseURL: string;
  customModel: string;
  customKey: string;
  credits: number;
}

const STORAGE_KEY = 'omnidev_settings_v1';

export const DEFAULT_SETTINGS: OmniDevSettings = {
  openRouterKey: '',
  openRouterModel: 'anthropic/claude-3.5-sonnet',
  ollamaBaseURL: 'http://localhost:11434',
  ollamaModel: 'llama3.1',
  activeProvider: 'openrouter',
  openaiKey: '',
  googleApiKey: '',
  googleModel: 'gemini-2.0-flash',
  customBaseURL: '',
  customModel: '',
  customKey: '',
  credits: 0,
};

export function loadSettings(): OmniDevSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Partial<OmniDevSettings>): OmniDevSettings {
  const current = loadSettings();
  const next = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function settingsToLLMConfig(s: OmniDevSettings) {
  switch (s.activeProvider) {
    case 'openrouter':
      return {
        provider: 'openrouter' as const,
        apiKey: s.openRouterKey,
        model: s.openRouterModel,
      };
    case 'ollama':
      return {
        provider: 'ollama' as const,
        baseURL: `${s.ollamaBaseURL}/v1`,
        model: s.ollamaModel,
        apiKey: 'ollama',
      };
    case 'openai':
      return {
        provider: 'openai' as const,
        apiKey: s.openaiKey,
        model: 'gpt-4o',
      };
    case 'google':
      return {
        provider: 'google' as const,
        apiKey: s.googleApiKey,
        model: s.googleModel || 'gemini-2.0-flash',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      };
    case 'custom':
      return {
        provider: 'custom' as const,
        baseURL: s.customBaseURL,
        model: s.customModel,
        apiKey: s.customKey,
      };
    default:
      return {
        provider: 'openrouter' as const,
        apiKey: s.openRouterKey,
        model: s.openRouterModel,
      };
  }
}
