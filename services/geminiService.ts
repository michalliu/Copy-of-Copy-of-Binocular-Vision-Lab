import { GoogleGenAI, Type } from "@google/genai";
import { SimulationParams, AIAnalysisResult } from "../types";
import { GEMINI_MODEL_FLASH, AI_SYSTEM_INSTRUCTION } from "../constants";

const apiKey = process.env.API_KEY || '';

// Safely initialize GenAI only if key exists, otherwise we'll handle errors gracefully in the UI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeSimulation = async (params: SimulationParams): Promise<AIAnalysisResult> => {
  if (!ai) {
    throw new Error("缺少 Gemini API 密钥。请检查您的环境配置。");
  }

  const prompt = `
    分析以下双目视觉模拟设置：
    - 瞳距 (基线): ${params.ipd} mm
    - 焦距: ${params.focalLength} mm
    - 目标物体距离: ${params.targetDistance} meters
    
    请提供：
    1. 此配置状态的简短标题（例如，“超立体视觉”、“标准人类视觉”）。
    2. 解释当前基线如何影响深度感知（立体视觉）。
    3. 对深度分辨率的影响（例如，视差是大还是小？）。
    4. 关于潜在视觉舒适度或计算机视觉应用的技术说明。
    
    请确保所有返回内容均为中文。
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: prompt,
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            explanation: { type: Type.STRING },
            depthImplications: { type: Type.STRING },
            technicalNote: { type: Type.STRING }
          },
          required: ["title", "explanation", "depthImplications", "technicalNote"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Gemini 没有响应");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini 分析失败:", error);
    throw error;
  }
};