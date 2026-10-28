import React, { useState, useEffect, useMemo } from 'react';
import { X, Server, Check, AlertCircle, RefreshCw, Eye, EyeOff, Zap, ShieldCheck, Search, ChevronDown, Sparkles, SlidersHorizontal } from 'lucide-react';
import { AIProviderConfig, AIProviderType, AIModelOption } from '../types';
import { DEFAULT_PROVIDER_CONFIGS, saveStoredProviderConfig } from '../lib/providerDefaults';

interface AIProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIProviderConfig;
  onSave: (newConfig: AIProviderConfig) => void;
}

export const AIProviderSettingsModal: React.FC<AIProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  if (!isOpen) return null;

  const [provider, setProvider] = useState<AIProviderType>(config.provider);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [modelName, setModelName] = useState(config.modelName);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Model Fetching States
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Fetch available models from backend endpoint
  const handleFetchModels = async (
    targetProvider = provider,
    targetKey = apiKey,
    targetUrl = baseUrl
  ) => {
    setIsLoadingModels(true);
    setModelsError(null);

    try {
      const response = await fetch('/api/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          apiKey: targetKey.trim(),
          baseUrl: targetUrl.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to retrieve models from provider');
      }

      const fetchedList: AIModelOption[] = data.models || [];
      setAvailableModels(fetchedList);

      // If current model isn't in fetched list, check for smart match or pick default
      if (fetchedList.length > 0) {
        const exactMatch = fetchedList.find((m) => m.id === modelName);
        if (!exactMatch) {
          // If user previously had a partial match (e.g. nemotron-3-ultra-550b-a55b -> nvidia/nemotron-3-ultra-550b-a55b)
          const partialMatch = fetchedList.find((m) =>
            m.id.toLowerCase().includes(modelName.toLowerCase().replace(/^(nvidia|meta|google|anthropic)\//, ''))
          );
          if (partialMatch) {
            setModelName(partialMatch.id);
          } else {
            // Find default model if present, otherwise first
            const defaultModel = DEFAULT_PROVIDER_CONFIGS[targetProvider].defaultModel;
            const hasDefault = fetchedList.find((m) => m.id === defaultModel);
            if (hasDefault) {
              setModelName(defaultModel);
            } else {
              setModelName(fetchedList[0].id);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Fetch models error:', err.message);
      setModelsError(err.message || 'Could not fetch models. Check network or API key.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Auto-fetch models when modal opens or provider changes
  useEffect(() => {
    if (isOpen) {
      handleFetchModels(provider, apiKey, baseUrl);
    }
  }, [provider]);

  const handleProviderSelect = (newProvider: AIProviderType) => {
    setProvider(newProvider);
    const defaults = DEFAULT_PROVIDER_CONFIGS[newProvider];
    setBaseUrl(defaults.defaultBaseUrl);
    setModelName(defaults.defaultModel);
    setTestStatus('idle');
    setTestMessage('');
    setModelSearch('');
    // Trigger models fetch for the new provider
    handleFetchModels(newProvider, apiKey, defaults.defaultBaseUrl);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging provider endpoint...');

    try {
      const response = await fetch('/api/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim(),
          modelName: modelName.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Connection test failed');
      }

      setTestStatus('success');
      setTestMessage(`Connected successfully! Latency: ${data.latencyMs}ms (${data.model})`);

      // If test succeeded, also ensure models list is fresh
      if (availableModels.length === 0) {
        handleFetchModels(provider, apiKey, baseUrl);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection failed. Please check credentials & URL.');
    }
  };

  const handleSave = () => {
    const newConfig: AIProviderConfig = {
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      modelName: modelName.trim()
    };
    saveStoredProviderConfig(newConfig);
    onSave(newConfig);
    onClose();
  };

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return availableModels;
    const query = modelSearch.toLowerCase();
    return availableModels.filter(
      (m) =>
        m.id.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query) ||
        (m.description && m.description.toLowerCase().includes(query))
    );
  }, [availableModels, modelSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Server className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Engine & Provider Settings
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Live Model Discovery
                </span>
              </h3>
              <p className="text-xs text-slate-400">Configure Gemini, OpenRouter, NVIDIA NIM, OmniRoute, or Local LLMs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Provider Selection Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Select Active AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DEFAULT_PROVIDER_CONFIGS) as AIProviderType[]).map((pKey) => {
                const pInfo = DEFAULT_PROVIDER_CONFIGS[pKey];
                const isActive = provider === pKey;
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handleProviderSelect(pKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950/70 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white truncate">{pInfo.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{pKey.toUpperCase()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">
                API Key {provider === 'gemini' && '(Optional if GEMINI_API_KEY is in .env)'}
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                {showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                <span>{showKey ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={() => {
                  if (apiKey.trim()) {
                    handleFetchModels(provider, apiKey, baseUrl);
                  }
                }}
                placeholder={DEFAULT_PROVIDER_CONFIGS[provider].placeholderKey}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleFetchModels(provider, apiKey, baseUrl)}
                disabled={isLoadingModels}
                title="Fetch models with this API key"
                className="px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 text-cyan-400 ${isLoadingModels ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Fetch Models</span>
              </button>
            </div>
          </div>

          {/* Model Selection / Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300">
                  Model Identifier
                </label>
                {availableModels.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {availableModels.length} models ready
                  </span>
                )}
                {isLoadingModels && (
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <RefreshCw className="size-3 animate-spin" /> Fetching models...
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsManualInput(!isManualInput)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="size-3" />
                <span>{isManualInput ? 'Use Dropdown' : 'Type Custom ID'}</span>
              </button>
            </div>

            {isManualInput ? (
              /* Freeform Text Input */
              <div className="space-y-1">
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. nvidia/nemotron-3-ultra-550b-a55b or gemini-3.8-flash"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Manual mode active. Enter any provider-specific model string.
                </p>
              </div>
            ) : (
              /* Dropdown with Search Filter */
              <div className="space-y-2">
                {/* Search Filter for large lists (OpenRouter has 450+, NVIDIA has 84) */}
                {availableModels.length > 10 && (
                  <div className="relative">
                    <Search className="size-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder={`Search ${availableModels.length} models (e.g. nemotron, llama, claude)...`}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    {modelSearch && (
                      <button
                        type="button"
                        onClick={() => setModelSearch('')}
                        className="text-[10px] text-slate-500 hover:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Dropdown Select Element */}
                <div className="relative">
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono appearance-none cursor-pointer"
                  >
                    {filteredModels.length > 0 ? (
                      filteredModels.map((m) => (
                        <option key={m.id} value={m.id} className="bg-slate-900 py-1">
                          {m.id} {m.description ? `— (${m.description})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value={modelName} className="bg-slate-900">
                        {modelName || 'No models match filter'}
                      </option>
                    )}
                  </select>
                  <ChevronDown className="size-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Selected Model Details Preview */}
                {modelName && (
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Sparkles className="size-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-400">Selected:</span>
                      <code className="text-cyan-300 font-mono truncate">{modelName}</code>
                    </div>
                    {availableModels.find((m) => m.id === modelName)?.description && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {availableModels.find((m) => m.id === modelName)?.description}
                      </span>
                    )}
                  </div>
                )}

                {modelsError && (
                  <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 mt-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{modelsError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Base URL */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              API Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Test Status Banner */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                testStatus === 'testing'
                  ? 'bg-slate-950 border-slate-800 text-slate-400'
                  : testStatus === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
              }`}
            >
              {testStatus === 'testing' && <RefreshCw className="size-4 animate-spin text-slate-400" />}
              {testStatus === 'success' && <ShieldCheck className="size-4 text-emerald-400" />}
              {testStatus === 'error' && <AlertCircle className="size-4 text-rose-400" />}
              <span className="flex-1 font-mono text-[11px] break-all">{testMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className="size-3.5 text-amber-400" />
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Check className="size-4" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
