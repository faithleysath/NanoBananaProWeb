import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, LogOut, Trash2 } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { settings, updateSettings, toggleSettings, removeApiKey, clearHistory } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <button onClick={toggleSettings} className="p-2 hover:bg-gray-800 rounded-lg sm:hidden">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-8 flex-1">
        {/* Resolution */}
        <section>
          <label className="block text-sm font-medium text-gray-400 mb-3">Image Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {(['1K', '2K', '4K'] as const).map((res) => (
              <button
                key={res}
                onClick={() => updateSettings({ resolution: res })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  settings.resolution === res
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </section>

        {/* Aspect Ratio */}
        <section>
          <label className="block text-sm font-medium text-gray-400 mb-3">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map((ratio) => {
              const isActive = settings.aspectRatio === ratio;
              const ratioPreviewStyles: Record<string, string> = {
                '1:1': 'w-6 h-6',
                '3:4': 'w-5 h-7',
                '4:3': 'w-7 h-5',
                '9:16': 'w-4 h-7',
                '16:9': 'w-7 h-4',
              };

              return (
                <button
                  key={ratio}
                  onClick={() => updateSettings({ aspectRatio: ratio })}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:bg-gray-900'
                  }`}
                >
                  <div
                    className={`rounded-sm border-2 ${
                      isActive ? 'border-blue-400 bg-blue-400/20' : 'border-gray-600 bg-gray-800'
                    } ${ratioPreviewStyles[ratio]}`}
                  />
                  <span className="text-xs font-medium">{ratio}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Grounding */}
        <section>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300">Google Search Grounding</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.useGrounding}
                onChange={(e) => updateSettings({ useGrounding: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-gray-800 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:bg-blue-600 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
            </div>
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Allow Gemini to access real-time information via Google Search.
          </p>
        </section>
        
        {/* Data Management */}
        <section className="pt-4 border-t border-gray-800">
            <button
                onClick={() => {
                    if (window.confirm("Clear all chat history?")) {
                        clearHistory();
                        toggleSettings();
                    }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-red-400 hover:bg-red-500/10 transition mb-3"
            >
                <Trash2 className="h-4 w-4" />
                <span>Clear Conversation</span>
            </button>

            <button
                onClick={() => {
                    if (window.confirm("Clear API Key and reset session?")) {
                        removeApiKey();
                    }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300 hover:bg-gray-700 transition"
            >
                <LogOut className="h-4 w-4" />
                <span>Clear API Key</span>
            </button>
        </section>
      </div>
    </div>
  );
};
