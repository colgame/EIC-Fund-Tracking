
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "./types";

// Using gemini-3-pro-preview for complex reasoning tasks like financial analysis and pattern recognition
export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight[]> => {
  try {
    // Initialize GoogleGenAI inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const summaryText = transactions.map(t => 
      `${t.date}: ${t.description} (${t.amount} PHP via ${t.mode})`
    ).join('\n');

    // Use gemini-3-pro-preview for its superior reasoning capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
              type: { 
                type: Type.STRING,
                description: "The type of insight: 'tip', 'warning', or 'positive'"
              }
            },
            required: ['title', 'content', 'type'],
            propertyOrdering: ["title", "content", "type"]
          }
        }
      }
    });

    // Access the text property directly (it's a getter, not a method)
    const text = response.text;
    if (!text) return [];
    
    try {
      return JSON.parse(text) as AIInsight[];
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error getting AI insights:", error);
    return [{
      title: "Insight Unavailable",
      content: "Could not generate insights at this time. Please check your connection.",
      type: "warning"
    }];
  }
};

// Using gemini-3-pro-preview for reliable extraction of structured data from natural language strings
export const parseNaturalLanguageTransaction = async (input: string): Promise<Partial<Transaction> | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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

    const text = response.text;
    if (!text) return null;

    try {
      return JSON.parse(text) as Partial<Transaction>;
    } catch (parseError) {
      console.error("Failed to parse natural language transaction:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error parsing transaction:", error);
    return null;
  }
};
