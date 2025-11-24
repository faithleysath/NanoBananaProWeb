import { create } from 'zustand';
import { AppSettings, ChatMessage, Content, Part } from '../types';

interface AppState {
  apiKey: string | null;
  settings: AppSettings;
  history: Content[]; // Raw history for the API
  messages: ChatMessage[]; // UI representation with IDs
  isLoading: boolean;
  isSettingsOpen: boolean;

  setApiKey: (key: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addMessage: (message: ChatMessage, content: Content) => void;
  updateLastMessage: (parts: Part[]) => void;
  setLoading: (loading: boolean) => void;
  toggleSettings: () => void;
  clearHistory: () => void;
  removeApiKey: () => void;
  deleteMessage: (id: string) => void;
  sliceMessages: (index: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  apiKey: null,
  settings: {
    resolution: '1K',
    aspectRatio: '1:1',
    useGrounding: false,
    customEndpoint: '',
    modelName: 'gemini-3-pro-image-preview',
  },
  history: [],
  messages: [],
  isLoading: false,
  isSettingsOpen: false,

  setApiKey: (key) => set({ apiKey: key }),
  
  updateSettings: (newSettings) => 
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  addMessage: (message, content) => 
    set((state) => ({ 
      messages: [...state.messages, message],
      history: [...state.history, content]
    })),

  updateLastMessage: (parts) => 
    set((state) => {
        const messages = [...state.messages];
        const history = [...state.history];
        
        if (messages.length > 0) {
            messages[messages.length - 1] = {
                ...messages[messages.length - 1],
                parts: [...parts] // Create a copy to trigger re-renders
            };
        }
        
        if (history.length > 0) {
            history[history.length - 1] = {
                ...history[history.length - 1],
                parts: [...parts]
            };
        }
        
        return { messages, history };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  clearHistory: () => set({ history: [], messages: [] }),

  removeApiKey: () => set({ apiKey: null }),

  deleteMessage: (id) =>
    set((state) => {
      const index = state.messages.findIndex((m) => m.id === id);
      if (index === -1) return {};

      const newMessages = [...state.messages];
      const newHistory = [...state.history];

      newMessages.splice(index, 1);
      newHistory.splice(index, 1);

      return { messages: newMessages, history: newHistory };
    }),

  sliceMessages: (index) =>
    set((state) => ({
      messages: state.messages.slice(0, index + 1),
      history: state.history.slice(0, index + 1),
    })),
}));
