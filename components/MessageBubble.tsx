import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Part } from '../types';
import { User, Sparkles, ChevronDown, ChevronRight, BrainCircuit, Trash2, RotateCcw } from 'lucide-react';

interface Props {
  message: ChatMessage;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
}

const openImageInNewTab = (mimeType: string, base64Data: string) => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

const renderThinkingContent = (part: Part, index: number) => {
  if (part.text) {
    return (
      <div key={index} className="mb-2 last:mb-0">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          }}
        >
          {part.text}
        </ReactMarkdown>
      </div>
    );
  }
  if (part.inlineData) {
     return (
        <div 
            key={index} 
            className="my-2 overflow-hidden rounded-md border border-gray-700/50 bg-black/20 max-w-sm mx-auto cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition"
            onClick={() => openImageInNewTab(part.inlineData!.mimeType, part.inlineData!.data)}
            title="Click to open full size"
        >
          <img
            src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
            alt="Thinking process sketch"
            className="h-auto max-w-full object-contain opacity-80 hover:opacity-100 transition"
            loading="lazy"
          />
        </div>
      );
  }
  return null;
};

const ThinkingBlock: React.FC<{ parts: Part[] }> = ({ parts }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 bg-gray-900/50 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 transition"
      >
        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <BrainCircuit className="h-3 w-3" />
        <span>Thinking Process</span>
      </button>
      
      {isExpanded && (
        <div className="border-t border-gray-700/30 px-3 py-3 text-sm text-gray-400 italic">
          {parts.map((part, i) => renderThinkingContent(part, i))}
        </div>
      )}
    </div>
  );
};

export const MessageBubble: React.FC<Props> = ({ message, onDelete, onRegenerate }) => {
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = useState(false);

  // Group parts: consecutive thinking parts should be grouped together
  const groupedParts: (Part | Part[])[] = [];
  
  message.parts.forEach((part) => {
    const lastGroup = groupedParts[groupedParts.length - 1];
    
    if (part.thought) {
      if (Array.isArray(lastGroup)) {
        // Append to existing thinking group
        lastGroup.push(part);
      } else {
        // Start new thinking group
        groupedParts.push([part]);
      }
    } else {
      // Regular part (Text or Image)
      groupedParts.push(part);
    }
  });

  const renderContent = (item: Part | Part[], index: number) => {
    // 1. Handle Thinking Block Group
    if (Array.isArray(item)) {
      return <ThinkingBlock key={`think-${index}`} parts={item} />;
    }
    
    const part = item;

    // 2. Handle Text (Markdown)
    if (part.text) {
      return (
        <div key={index} className="markdown-content leading-relaxed break-words overflow-hidden">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom components to ensure styles match the theme
              p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
              a: ({href, children}) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {children}
                </a>
              ),
              ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
              li: ({children}) => <li className="pl-1">{children}</li>,
              code: ({children}) => (
                <code className="rounded bg-gray-800/50 px-1 py-0.5 font-mono text-sm text-blue-200">
                  {children}
                </code>
              ),
              pre: ({children}) => (
                <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-sm border border-gray-800">
                  {children}
                </pre>
              ),
              blockquote: ({children}) => (
                <blockquote className="border-l-4 border-gray-600 pl-4 py-1 my-3 text-gray-400 italic bg-gray-900/30 rounded-r">
                  {children}
                </blockquote>
              ),
              table: ({children}) => (
                <div className="overflow-x-auto mb-3 rounded-lg border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">{children}</table>
                </div>
              ),
              thead: ({children}) => <thead className="bg-gray-800 text-gray-200">{children}</thead>,
              tbody: ({children}) => <tbody className="divide-y divide-gray-800 bg-gray-900/50">{children}</tbody>,
              tr: ({children}) => <tr>{children}</tr>,
              th: ({children}) => (
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">{children}</th>
              ),
              td: ({children}) => <td className="px-3 py-2 text-sm text-gray-300 whitespace-pre-wrap">{children}</td>,
            }}
          >
            {part.text}
          </ReactMarkdown>
        </div>
      );
    }
    
    // 3. Handle Images
    if (part.inlineData) {
      return (
        <div 
            key={index} 
            className="mt-3 overflow-hidden rounded-xl border border-gray-700/50 bg-gray-950/50 max-w-lg mx-auto cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition"
            onClick={() => openImageInNewTab(part.inlineData!.mimeType, part.inlineData!.data)}
            title="Click to open full size"
        >
          <img
            src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
            alt="Generated or uploaded content"
            className="h-auto max-w-full object-contain"
            loading="lazy"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={`flex w-full gap-4 ${isUser ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20 mt-1">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={`flex max-w-[85%] md:max-w-[75%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-5 py-3.5 shadow-sm w-full ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
          }`}
        >
          {groupedParts.map((item, i) => renderContent(item, i))}
          
          {message.isError && (
             <div className="mt-2 text-xs text-red-300 font-medium">
                Failed to generate response. Please check your API key or connection.
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 px-1">
           <span className="text-[10px] text-gray-500 font-medium">
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </span>
           
           {/* Actions */}
           <div className={`flex items-center gap-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
              <button 
                onClick={() => onRegenerate(message.id)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-blue-400"
                title="Regenerate from here"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <button 
                onClick={() => onDelete(message.id)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-red-400"
                title="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </button>
           </div>
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 mt-1">
          <User className="h-4 w-4 text-gray-300" />
        </div>
      )}
    </div>
  );
};
