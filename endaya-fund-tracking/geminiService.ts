
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "./types";

// Always use the named parameter for apiKey and obtain it from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview for text analysis as it is optimized for reasoning and data processing
export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight[]> => {
  try {
    const summaryText = transactions.map(t => 
      `${t.date}: ${t.description} (${t.amount} PHP via ${t.mode})`
    ).join('\n');

    // Use ai.models.generateContent to query the model directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these financial transactions and provide 3 key insights. 
      Focus on spending patterns, potential savings, or unusual activities.
      Return the output as a JSON array of objects with 'title', 'content', and 'type' (must be 'tip', 'warning', or 'positive').
      
      Transactions:
      ${summaryText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ['title', 'content', 'type']
          }
        }
      }
    });

    // Access the text property directly (not as a method)
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error getting AI insights:", error);
    return [{
      title: "Insight Unavailable",
      content: "Could not generate insights at this time. Please check your connection.",
      type: "warning"
    }];
  }
};

// Using gemini-3-flash-preview for natural language parsing tasks
export const parseNaturalLanguageTransaction = async (input: string): Promise<Partial<Transaction> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Parse this natural language financial transaction: "${input}"
      Extract: date (YYYY-MM-DD), description, amount (absolute number), type (income or expense), mode (BDO, GCash, or Cash), and category.
      If information is missing, use sensible defaults.
      Today is ${new Date().toISOString().split('T')[0]}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING },
            mode: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ['description', 'amount', 'type', 'mode', 'category']
        }
      }
    });

    // Access the text property directly
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error parsing transaction:", error);
    return null;
  }
};
