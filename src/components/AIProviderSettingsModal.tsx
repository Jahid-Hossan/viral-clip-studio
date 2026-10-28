import React, { useState } from 'react';
import { X, Cpu, Server, Check, AlertCircle, RefreshCw, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';
import { AIProviderConfig, AIProviderType } from '../types';
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

  const handleProviderSelect = (newProvider: AIProviderType) => {
    setProvider(newProvider);
    const defaults = DEFAULT_PROVIDER_CONFIGS[newProvider];
    setBaseUrl(defaults.defaultBaseUrl);
    setModelName(defaults.defaultModel);
    setTestStatus('idle');
    setTestMessage('');
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
          apiKey,
          baseUrl,
          modelName
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Connection test failed');
      }

      setTestStatus('success');
      setTestMessage(`Connected successfully! Latency: ${data.latencyMs}ms (${data.model})`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Server className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Engine & Provider Settings</h3>
              <p className="text-xs text-slate-400">Configure Gemini, OpenRouter, OmniRoute, NVIDIA, or Local LLMs</p>
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

          {/* Model Name */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Model Identifier
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. gemini-3.8-flash or meta-llama/llama-3.3-70b-instruct"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
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
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={DEFAULT_PROVIDER_CONFIGS[provider].placeholderKey}
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
              <span className="flex-1 font-mono text-[11px]">{testMessage}</span>
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
