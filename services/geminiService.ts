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
  const currentUserContent = constructUserContent(prompt, images);
  const contentsPayload = [...history, currentUserContent];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: settings.modelName || "gemini-3-pro-image-preview",
      contents: contentsPayload,
      config: {
        imageConfig: {
          imageSize: settings.resolution,
          aspectRatio: settings.aspectRatio,
        },
        tools: settings.useGrounding ? [{ googleSearch: {} }] : [],
        responseModalities: ["TEXT", "IMAGE"],
        // @ts-ignore - The SDK types might not have thinkingConfig yet
        thinkingConfig: {
            includeThoughts: true,
        },
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
        // Handle Text (Thought or Regular)
        if (part.text) {
          const isThought = !!(part as any).thought;
          const lastPart = currentParts[currentParts.length - 1];

          // Check if we should append to the last part or start a new one.
          // Append if: Last part exists AND is text AND matches thought type.
          if (
            lastPart && 
            lastPart.text !== undefined && 
            !!lastPart.thought === isThought
          ) {
            lastPart.text += part.text;
          } else {
            // New text block
            currentParts.push({ 
              text: part.text, 
              thought: isThought 
            });
          }
        } 
        // Handle Images
        else if (part.inlineData) {
          currentParts.push({ 
            inlineData: {
                mimeType: part.inlineData.mimeType || 'image/png',
                data: part.inlineData.data || ''
            }, 
            thought: !!(part as any).thought 
          });
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

// Keep the original function for backward compatibility if needed, 
// or for cases where we don't want streaming (though we plan to switch).
// We can implement it using the stream function to reduce code duplication.
export const generateContent = async (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings
) => {
  const stream = streamGeminiResponse(apiKey, history, prompt, images, settings);
  let finalResult = null;
  
  for await (const result of stream) {
    finalResult = result;
  }
  
  if (!finalResult) {
    throw new Error("No content generated.");
  }

  return {
    userContent: finalResult.userContent,
    modelContent: {
      role: "model" as const,
      parts: finalResult.modelParts
    }
  };
};
