import { AIProviderConfig, AIProviderType } from '../types';

export const DEFAULT_PROVIDER_CONFIGS: Record<AIProviderType, { name: string; defaultBaseUrl: string; defaultModel: string; placeholderKey: string }> = {
  gemini: {
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-3.8-flash',
    placeholderKey: 'AIzaSy...'
  },
  openrouter: {
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    placeholderKey: 'sk-or-v1-...'
  },
  omniroute: {
    name: 'OmniRoute Hub',
    defaultBaseUrl: 'http://localhost:8000/v1',
    defaultModel: 'omni-fast',
    placeholderKey: 'omni-token-...'
  },
  nvidia: {
    name: 'NVIDIA NIM',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    placeholderKey: 'nvapi-...'
  },
  opencode: {
    name: 'OpenCode / Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.3',
    placeholderKey: 'ollama (optional)'
  },
  custom: {
    name: 'Custom OpenAI-Compatible API',
    defaultBaseUrl: 'https://api.your-proxy.com/v1',
    defaultModel: 'gpt-4o-mini',
    placeholderKey: 'api-key-...'
  }
};

export function getStoredProviderConfig(): AIProviderConfig {
  try {
    const saved = localStorage.getItem('viralclip_provider_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse stored provider config', e);
  }

  return {
    provider: 'gemini',
    apiKey: '',
    baseUrl: DEFAULT_PROVIDER_CONFIGS.gemini.defaultBaseUrl,
    modelName: DEFAULT_PROVIDER_CONFIGS.gemini.defaultModel
  };
}

export function saveStoredProviderConfig(config: AIProviderConfig) {
  try {
    localStorage.setItem('viralclip_provider_config', JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save provider config', e);
  }
}
