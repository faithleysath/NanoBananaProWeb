import { create } from 'zustand';
import { AppSettings, ChatMessage, Content, Part } from '../types';

interface AppState {
  apiKey: string | null;
  settings: AppSettings;
  messages: ChatMessage[]; // Single Source of Truth
  isLoading: boolean;
  isSettingsOpen: boolean;

  setApiKey: (key: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (parts: Part[], isError?: boolean) => void;
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
    theme: 'system',
  },
  messages: [],
  isLoading: false,
  isSettingsOpen: false,

  setApiKey: (key) => set({ apiKey: key }),
  
  updateSettings: (newSettings) => 
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message],
    })),

  updateLastMessage: (parts, isError = false) => 
    set((state) => {
        const messages = [...state.messages];
        
        if (messages.length > 0) {
            messages[messages.length - 1] = {
                ...messages[messages.length - 1],
                parts: [...parts], // Create a copy to trigger re-renders
                isError: isError
            };
        }
        
        return { messages };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  clearHistory: () => set({ messages: [] }),

  removeApiKey: () => set({ apiKey: null }),

  deleteMessage: (id) =>
    set((state) => {
      const index = state.messages.findIndex((m) => m.id === id);
      if (index === -1) return {};

      const newMessages = [...state.messages];
      newMessages.splice(index, 1);

      return { messages: newMessages };
    }),

  sliceMessages: (index) =>
    set((state) => ({
      messages: state.messages.slice(0, index + 1),
    })),
}));
