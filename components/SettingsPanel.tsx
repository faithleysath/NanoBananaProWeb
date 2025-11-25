import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, LogOut, Trash2, Sun, Moon, Monitor, Share2, Bookmark } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { apiKey, settings, updateSettings, toggleSettings, removeApiKey, clearHistory } = useAppStore();

  const getBookmarkUrl = () => {
    if (!apiKey) return window.location.href;
    const params = new URLSearchParams();
    params.set('apikey', apiKey);
    if (settings.customEndpoint) params.set('endpoint', settings.customEndpoint);
    if (settings.modelName) params.set('model', settings.modelName);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleCreateBookmark = () => {
    if (!apiKey) return;
    const url = getBookmarkUrl();
    
    // Update address bar without reloading
    window.history.pushState({ path: url }, '', url);

    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
        alert("URL updated & copied! \n\n1. The address bar now contains your settings.\n2. Press Ctrl+D (Cmd+D) to bookmark this page immediately.");
    }).catch(err => {
        console.error("Failed to copy", err);
        prompt("Copy this URL or press Ctrl+D to bookmark:", url);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
        <button onClick={toggleSettings} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:hidden">
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-8 flex-1">
        {/* Resolution */}
        <section className='mb-4'>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Image Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {(['1K', '2K', '4K'] as const).map((res) => (
              <button
                key={res}
                onClick={() => updateSettings({ resolution: res })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  settings.resolution === res
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </section>

        {/* Aspect Ratio */}
        <section>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Auto', '1:1', '3:4', '4:3', '9:16', '16:9'] as const).map((ratio) => {
              const isActive = settings.aspectRatio === ratio;
              const ratioPreviewStyles: Record<string, string> = {
                'Auto': 'w-6 h-6 border-dashed',
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
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div
                    className={`rounded-sm border-2 ${
                      isActive ? 'border-blue-400 bg-blue-100 dark:bg-blue-400/20' : 'border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-800'
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
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">Google Search Grounding</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.useGrounding}
                onChange={(e) => updateSettings({ useGrounding: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-800 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:bg-blue-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
            </div>
          </label>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Allow Gemini to access real-time information via Google Search.
          </p>
        </section>

        {/* Thinking Process */}
        <section>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">Show Thinking Process</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.enableThinking}
                onChange={(e) => updateSettings({ enableThinking: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-800 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:bg-blue-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
            </div>
          </label>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
             Show the model's internal thought process. Disable this for models that don't support thinking (e.g. gemini-2.5-flash-image / Nano Banana).
          </p>
        </section>

        {/* Streaming */}
        <section>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">Stream Response</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.streamResponse}
                onChange={(e) => updateSettings({ streamResponse: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-800 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:bg-blue-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
            </div>
          </label>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
             Stream the model's response token by token. Disable for single-shot responses.
          </p>
        </section>
        
        {/* Share Configuration */}
        <section className="pt-4 border-t border-gray-200 dark:border-gray-800 mb-4">
           <div className="flex gap-2 mb-2">
             <button
               onClick={handleCreateBookmark}
               className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition"
             >
               <Share2 className="h-4 w-4" />
               <span className="text-xs sm:text-sm">Update URL</span>
             </button>

             <a
               href={getBookmarkUrl()}
               onClick={(e) => e.preventDefault()} // Prevent navigation, strictly for dragging
               className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-3 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-grab active:cursor-grabbing transition text-sm font-medium"
               title="Drag this button to your bookmarks bar"
             >
               <Bookmark className="h-4 w-4" />
               <span className="text-xs sm:text-sm">Drag to Bookmark</span>
             </a>
           </div>
        </section>

        {/* Data Management */}
        <section className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
                onClick={() => {
                    if (window.confirm("Clear all chat history?")) {
                        clearHistory();
                        toggleSettings();
                    }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 p-3 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 transition mb-3"
            >
                <Trash2 className="h-4 w-4" />
                <span>Clear Conversation</span>
            </button>

            <button
                onClick={() => {
                    if (window.confirm("Remove API Key? (Chat history will be preserved)")) {
                        removeApiKey();
                    }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
                <LogOut className="h-4 w-4" />
                <span>Clear API Key</span>
            </button>
        </section>

        {/* Info */}
        <div className="mt-1 pb-4 text-center text-[10px] text-gray-400 dark:text-gray-600 space-y-1">
           <p>Model: {settings.modelName || 'Default'}</p>
           {settings.customEndpoint && <p className="truncate px-4">Endpoint: {settings.customEndpoint}</p>}
        </div>
      </div>
    </div>
  );
};
