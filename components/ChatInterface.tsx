import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { streamGeminiResponse } from '../services/geminiService';
import { convertMessagesToHistory } from '../utils/messageUtils';
import { ChatMessage, Attachment, Part } from '../types';
import { Sparkles } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const { 
    apiKey, 
    messages, 
    settings, 
    addMessage, 
    updateLastMessage,
    isLoading, 
    setLoading,
    deleteMessage,
    sliceMessages
  } = useAppStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string, attachments: Attachment[]) => {
    if (!apiKey) return;

    // Capture the current messages state *before* adding the new user message.
    // This allows us to generate history up to this point.
    const currentMessages = useAppStore.getState().messages;
    const history = convertMessagesToHistory(currentMessages);

    setLoading(true);
    const msgId = Date.now().toString();

    // Construct User UI Message
    const userParts: Part[] = [];
    attachments.forEach(att => {
        userParts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.base64Data
            }
        });
    });
    if (text) userParts.push({ text });

    const userMessage: ChatMessage = {
      id: msgId,
      role: 'user',
      parts: userParts,
      timestamp: Date.now()
    };
    
    // Add User Message
    addMessage(userMessage);

    // Prepare Model Placeholder
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      parts: [], // Start empty
      timestamp: Date.now()
    };
    
    // Add Placeholder Model Message to Store
    addMessage(modelMessage);

    try {
      // Prepare images for service
      const imagesPayload = attachments.map(a => ({
          base64Data: a.base64Data,
          mimeType: a.mimeType
      }));

      abortControllerRef.current = new AbortController();

      const stream = streamGeminiResponse(
        apiKey,
        history, 
        text,
        imagesPayload,
        settings,
        abortControllerRef.current.signal
      );

      for await (const chunk of stream) {
          updateLastMessage(chunk.modelParts);
      }

    } catch (error: any) {
      if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        console.log("Generation stopped by user");
        return;
      }
      console.error("Failed to generate", error);
      
      let errorText = "Generation failed. Please check your network and API key.";
      if (error.message) {
          errorText = `Error: ${error.message}`;
      }

      // Update the placeholder message with error text and flag
      updateLastMessage([{ text: errorText }], true);

    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDelete = (id: string) => {
    deleteMessage(id);
  };

  const handleRegenerate = async (id: string) => {
    if (isLoading) return;

    const index = messages.findIndex(m => m.id === id);
    if (index === -1) return;
    
    const message = messages[index];
    let targetUserMessage: ChatMessage | undefined;
    let sliceIndex = -1;

    if (message.role === 'user') {
        targetUserMessage = message;
        sliceIndex = index - 1;
    } else if (message.role === 'model') {
        // Find preceding user message
        if (index > 0 && messages[index-1].role === 'user') {
            targetUserMessage = messages[index-1];
            sliceIndex = index - 2;
        }
    }
    
    if (!targetUserMessage) return;

    // Extract content
    const textPart = targetUserMessage.parts.find(p => p.text);
    const text = textPart ? textPart.text : '';
    const imageParts = targetUserMessage.parts.filter(p => p.inlineData);
    
    const attachments: Attachment[] = imageParts.map(p => ({
        file: new File([], "placeholder"), // Dummy file object
        preview: `data:${p.inlineData!.mimeType};base64,${p.inlineData!.data}`,
        base64Data: p.inlineData!.data || '',
        mimeType: p.inlineData!.mimeType || ''
    }));

    // Slice history (delete target and future)
    sliceMessages(sliceIndex);

    // Resend
    handleSend(text || '', attachments);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-8 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-40 select-none">
            <div className="mb-6 rounded-3xl bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-800">
               <Sparkles className="h-16 w-16 text-blue-500 mb-4 mx-auto animate-pulse-fast" />
               <h3 className="text-2xl font-bold text-white mb-2">Gemini 3 Pro</h3>
               <p className="max-w-xs text-sm text-gray-400">
                 Start typing to create images, edit them conversationally, or ask complex questions.
               </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isLast={index === messages.length - 1}
            isGenerating={isLoading}
            onDelete={handleDelete}
            onRegenerate={handleRegenerate}
          />
        ))}

        {isLoading && (
          <div className="flex w-full items-center justify-center py-4">
            <span className="animate-pulse font-medium text-gray-500 text-sm">Gemini is thinking...</span>
          </div>
        )}
      </div>

      <InputArea onSend={handleSend} onStop={handleStop} disabled={isLoading} />
    </div>
  );
};
