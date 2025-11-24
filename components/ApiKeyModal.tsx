import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Key, ExternalLink } from 'lucide-react';

export const ApiKeyModal: React.FC = () => {
  const { setApiKey } = useAppStore();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.length < 10) {
      setError('Invalid API Key format.');
      return;
    }
    setApiKey(inputKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-6 sm:p-8">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-blue-500/10 p-4 ring-1 ring-blue-500/50">
            <Key className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <h2 className="mb-2 text-center text-2xl font-bold text-white">Enter API Key</h2>
        <p className="mb-8 text-center text-gray-400">
          This app runs 100% on your browser. Your key is kept in memory and will be cleared on refresh.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="sr-only">API Key</label>
            <input
              type="password"
              id="apiKey"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              placeholder="AIzaSy..."
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!inputKey}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Creating
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-500 hover:text-blue-400 transition"
          >
            <span>Get a Gemini API Key</span>
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
