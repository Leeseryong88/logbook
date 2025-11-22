import { GoogleGenAI, Type } from "@google/genai";
import { MarineLife } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize Gemini safely. If no key is present, we handle it gracefully in calls.
const ai = new GoogleGenAI({ apiKey });

export const identifyMarineLife = async (base64Image: string): Promise<MarineLife | null> => {
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }

  try {
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', 
              data: base64Image.split(',')[1] || base64Image // Remove data:image/jpeg;base64, prefix if present
            }
          },
          {
            text: "Identify the main marine creature in this image. Provide the name, scientific name, and a short description."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "description"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    return {
      id: Date.now().toString(),
      name: data.name,
      scientificName: data.scientificName,
      description: data.description,
      imageUrl: base64Image
    };

  } catch (error) {
    console.error("Error identifying marine life:", error);
    return null;
  }
};

export const enrichDiveLogNotes = async (notes: string, location: string): Promise<string> => {
  if (!apiKey) return "AI 기능을 사용하려면 API 키가 필요합니다.";

  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `Dive Location: ${location}. User Notes: ${notes}. 
      Please rewrite these notes to be more descriptive and professional for a dive log. 
      Mention likely marine life if the location is famous, but keep it grounded in the user's notes. 
      Output in Korean.`,
    });

    return response.text || notes;
  } catch (error) {
    console.error("Error enriching notes:", error);
    return notes;
  }
};

export const getDiveAdvice = async (question: string): Promise<string> => {
  if (!apiKey) return "API 키가 설정되지 않았습니다.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert scuba diving instructor and marine biologist. Answer the following question for a diver: ${question}. Keep the answer helpful, safety-conscious, and concise. Output in Korean.`,
    });
    return response.text || "응답을 생성할 수 없습니다.";
  } catch (e) {
    return "AI 서비스 오류가 발생했습니다.";
  }
};
