export interface AppSettings {
  resolution: '1K' | '2K' | '4K';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  useGrounding: boolean;
  customEndpoint?: string;
  modelName?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  thought?: boolean;
  thoughtSignature?: string;
}

export interface Content {
  role: 'user' | 'model';
  parts: Part[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: Part[];
  timestamp: number;
  isError?: boolean;
}

export interface Attachment {
  file: File;
  preview: string; // Base64 for UI preview
  base64Data: string; // Raw base64 for API
  mimeType: string;
}
