import { GoogleGenAI, Content, Part as SDKPart } from "@google/genai";
import { AppSettings, Part } from '../types';

// Helper to construct user content
const constructUserContent = (prompt: string, images: { base64Data: string; mimeType: string }[]): Content => {
  const userParts: SDKPart[] = [];
  
  images.forEach((img) => {
    userParts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64Data,
      },
    });
  });

  if (prompt.trim()) {
    userParts.push({ text: prompt });
  }

  return {
    role: "user",
    parts: userParts,
  };
};

export const streamGeminiResponse = async function* (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings,
  signal?: AbortSignal
) {
  const ai = new GoogleGenAI(
    settings.customEndpoint 
      ? { apiKey, httpOptions: { baseUrl: settings.customEndpoint } }
      : { apiKey }
  );

  // Filter out thought parts from history to avoid sending thought chains back to the model
  const cleanHistory = history.map(item => {
    if (item.role === 'model') {
      return {
        ...item,
        parts: item.parts.filter(p => !p.thought)
      };
    }
    return item;
  }).filter(item => item.parts.length > 0);

  const currentUserContent = constructUserContent(prompt, images);
  const contentsPayload = [...cleanHistory, currentUserContent];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: settings.modelName || "gemini-3-pro-image-preview",
      contents: contentsPayload,
      config: {
        imageConfig: {
          imageSize: settings.resolution,
          ...(settings.aspectRatio !== 'Auto' ? { aspectRatio: settings.aspectRatio } : {}),
        },
        tools: settings.useGrounding ? [{ googleSearch: {} }] : [],
        responseModalities: ["TEXT", "IMAGE"],
        ...(settings.enableThinking ? {
            thinkingConfig: {
                includeThoughts: true,
            }
        } : {}),
      },
    });

    let currentParts: Part[] = [];

    for await (const chunk of responseStream) {
      if (signal?.aborted) {
        break;
      }
      const candidates = chunk.candidates;
      if (!candidates || candidates.length === 0) continue;
      
      const newParts = candidates[0].content?.parts || [];

      for (const part of newParts) {
        const signature = (part as any).thoughtSignature;
        const isThought = !!(part as any).thought;

        // Handle Text (Thought or Regular)
        if (part.text !== undefined) {
          const lastPart = currentParts[currentParts.length - 1];

          // Check if we should append to the last part or start a new one.
          // Append if: Last part exists AND is text AND matches thought type.
          if (
            lastPart && 
            lastPart.text !== undefined && 
            !!lastPart.thought === isThought
          ) {
            lastPart.text += part.text;
            if (signature) {
                lastPart.thoughtSignature = signature;
            }
          } else {
            // New text block
            const newPart: Part = { 
              text: part.text, 
              thought: isThought 
            };
            if (signature) {
                newPart.thoughtSignature = signature;
            }
            currentParts.push(newPart);
          }
        } 
        // Handle Images
        else if (part.inlineData) {
          const newPart: Part = { 
            inlineData: {
                mimeType: part.inlineData.mimeType || 'image/png',
                data: part.inlineData.data || ''
            }, 
            thought: isThought 
          };
          if (signature) {
              newPart.thoughtSignature = signature;
          }
          currentParts.push(newPart);
        }
      }

      yield {
        userContent: currentUserContent,
        modelParts: currentParts // Yield the accumulated parts
      };
    }
  } catch (error) {
    console.error("Gemini API Stream Error:", error);
    throw error;
  }
};
