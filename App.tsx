import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ChatInterface } from './components/ChatInterface';
import { SettingsPanel } from './components/SettingsPanel';
import { Settings, MessageSquare, AlertCircle, Sun, Moon, Monitor, Github } from 'lucide-react';

const App: React.FC = () => {
  const { apiKey, setApiKey, settings, updateSettings, isSettingsOpen, toggleSettings } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const urlApiKey = params.get('apikey');
    const urlEndpoint = params.get('endpoint');
    const urlModel = params.get('model');

    if (urlEndpoint || urlModel) {
      updateSettings({
        ...(urlEndpoint ? { customEndpoint: urlEndpoint } : {}),
        ...(urlModel ? { modelName: urlModel } : {}),
      });
    }

    if (urlApiKey) {
      setApiKey(urlApiKey);
    }
  }, []);

  // Theme handling
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      if (settings.theme === 'dark' || (settings.theme === 'system' && systemTheme.matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    systemTheme.addEventListener('change', applyTheme);
    return () => systemTheme.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  if (!mounted) return null;

  return (
    <div className="flex h-dvh w-full flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden relative transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-6 py-4 backdrop-blur-md z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Gemini 3 Pro</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Client-Side AI • Image Preview</p>
          </div>
        </div>
        
        {apiKey && (
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/faithleysath/NanoBananaProWeb"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="GitHub Repository"
            >
              <Github className="h-6 w-6 animate-heartbeat-mixed group-hover:animate-none" />
            </a>
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="rounded-lg p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Toggle Theme"
            >
              {settings.theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
            <button
              onClick={toggleSettings}
              className="rounded-lg p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Settings"
            >
              <Settings className="h-6 w-6" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-row">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface />
        </div>

        {/* Settings Sidebar (Desktop/Mobile Overlay) */}
        <div 
          className={`
            absolute inset-0 z-20 flex justify-end
            transition-all duration-300 ease-in-out
            ${isSettingsOpen 
              ? 'bg-black/50 backdrop-blur-sm pointer-events-auto' 
              : 'bg-transparent backdrop-blur-none pointer-events-none'
            }
            
            sm:static sm:z-auto sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-auto sm:overflow-hidden
            sm:transition-[width,border-color]
            ${isSettingsOpen 
              ? 'sm:w-80 sm:border-l sm:border-gray-200 dark:sm:border-gray-800' 
              : 'sm:w-0 sm:border-l-0 sm:border-transparent'
            }
          `}
          onClick={() => {
            // Close on backdrop click (mobile only)
            if (window.innerWidth < 640 && isSettingsOpen) {
               toggleSettings();
            }
          }}
        >
           <div 
             className={`
               w-full h-full sm:w-80 bg-white dark:bg-gray-900 
               shadow-2xl sm:shadow-none
               overflow-y-auto overflow-x-hidden border-l border-gray-200 dark:border-gray-800 sm:border-none
               
               transition-transform duration-300 ease-in-out
               ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}
               sm:translate-x-0
             `}
             onClick={(e) => e.stopPropagation()}
           >
              <div className="p-4 w-full">
                  <SettingsPanel />
              </div>
           </div>
        </div>
      </main>

      {/* Modals */}
      {!apiKey && <ApiKeyModal />}
    </div>
  );
};

export default App;
