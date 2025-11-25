import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { ErrorBoundary } from './ErrorBoundary';
import { ThinkingIndicator } from './ThinkingIndicator';
import { streamGeminiResponse, generateContent } from '../services/geminiService';
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
  
  const [showArcade, setShowArcade] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isLoading) {
        setShowArcade(true);
        setIsExiting(false);
    }
  }, [isLoading]);

  const handleCloseArcade = () => {
    setIsExiting(true);
    setTimeout(() => {
        setShowArcade(false);
        setIsExiting(false);
    }, 200); // Match animation duration
  };

  const handleToggleArcade = () => {
      if (showArcade && !isExiting) {
          handleCloseArcade();
      } else if (!showArcade) {
          setShowArcade(true);
      }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, showArcade]);

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

      const startTime = Date.now();
      let thinkingDuration = 0;
      let isThinking = false;

      if (settings.streamResponse) {
          const stream = streamGeminiResponse(
            apiKey,
            history, 
            text,
            imagesPayload,
            settings,
            abortControllerRef.current.signal
          );

          for await (const chunk of stream) {
              // Check if currently generating thought
              const lastPart = chunk.modelParts[chunk.modelParts.length - 1];
              if (lastPart && lastPart.thought) {
                  isThinking = true;
                  thinkingDuration = (Date.now() - startTime) / 1000;
              } else if (isThinking && lastPart && !lastPart.thought) {
                // Just finished thinking
                isThinking = false;
              }

              updateLastMessage(chunk.modelParts, false, isThinking ? thinkingDuration : undefined);
          }
          
          // Final update to ensure duration is set if ended while thinking (unlikely but possible)
          // or to set the final duration if the whole response was a thought
          if (isThinking) {
              thinkingDuration = (Date.now() - startTime) / 1000;
              updateLastMessage(useAppStore.getState().messages.slice(-1)[0].parts, false, thinkingDuration);
          }
      } else {
          const result = await generateContent(
            apiKey,
            history, 
            text,
            imagesPayload,
            settings,
            abortControllerRef.current.signal
          );

          // Calculate thinking duration for non-streaming response
          let totalDuration = (Date.now() - startTime) / 1000;
          // In non-streaming, we can't easily separate thinking time from generation time precisely
          // unless the model metadata provides it (which it currently doesn't in a standardized way exposed here).
          // But we can check if there are thinking parts and attribute some time or just show total time?
          // The UI expects thinkingDuration to show beside the "Thinking Process" block.
          // If we have thought parts, we can pass the total duration as a fallback, or 0 if we don't want to guess.
          // However, existing UI logic in MessageBubble uses `thinkingDuration` prop on the message.
          
          const hasThought = result.modelParts.some(p => p.thought);
          updateLastMessage(result.modelParts, false, hasThought ? totalDuration : undefined);
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 transition-colors duration-200">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-8 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-40 select-none">
            <div className="mb-6 rounded-3xl bg-gray-50 dark:bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800 transition-colors duration-200">
               <Sparkles className="h-16 w-16 text-blue-500 mb-4 mx-auto animate-pulse-fast" />
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gemini 3 Pro</h3>
               <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                 Start typing to create images, edit them conversationally, or ask complex questions.
               </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <ErrorBoundary key={msg.id}>
            <MessageBubble 
              message={msg} 
              isLast={index === messages.length - 1}
              isGenerating={isLoading}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
            />
          </ErrorBoundary>
        ))}

        {showArcade && (
            <ThinkingIndicator 
                isThinking={isLoading} 
                onClose={handleCloseArcade}
                isExiting={isExiting}
            />
        )}
      </div>

      <InputArea 
        onSend={handleSend} 
        onStop={handleStop} 
        disabled={isLoading}
        onOpenArcade={handleToggleArcade}
        isArcadeOpen={showArcade}
      />
    </div>
  );
};
