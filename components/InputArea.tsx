import React, { useState, useRef } from 'react';
import { Send, ImagePlus, X, Square } from 'lucide-react';
import { Attachment } from '../types';

interface Props {
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  disabled: boolean;
}

export const InputArea: React.FC<Props> = ({ onSend, onStop, disabled }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      
      const newAttachments: Attachment[] = [];
      
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          try {
             const base64 = await fileToBase64(file);
             // Strip the data:image/jpeg;base64, part for the API payload
             const base64Data = base64.split(',')[1];
             
             newAttachments.push({
               file,
               preview: base64,
               base64Data,
               mimeType: file.type
             });
          } catch (err) {
             console.error("Error reading file", err);
          }
        }
      }
      
      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;
    
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 pb-safe transition-colors duration-200">
      <div className="mx-auto max-w-4xl">
        
        {/* Preview Area */}
        {attachments.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-3 mb-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative h-20 w-20 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 group">
                <img 
                  src={att.preview} 
                  alt="preview" 
                  className="h-full w-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition" 
                />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800 p-2 shadow-inner ring-1 ring-gray-200 dark:ring-gray-700/50 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all duration-200">
          
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || attachments.length >= 14}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition disabled:opacity-50"
            title="Upload Image"
          >
            <ImagePlus className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Describe an image or ask a question..."
            className="mb-1 max-h-[200px] min-h-10 w-full resize-none bg-transparent py-2.5 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none disabled:opacity-50 field-sizing-content"
            rows={1}
          />

          {disabled ? (
            <button
              onClick={onStop}
              className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition"
              title="Stop Generation"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim() && attachments.length === 0}
              className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:shadow-none transition"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
           Enter to send, Shift + Enter for new line. Supports up to 14 reference images.
        </div>
      </div>
    </div>
  );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
