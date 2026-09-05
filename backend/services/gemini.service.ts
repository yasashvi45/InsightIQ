import { getGeminiClient } from "../config/gemini";
import { buildAiSystemPrompt } from "../utils/promptBuilder";
import { supabase } from "../config/supabase";
import Papa from "papaparse";

// Maintain a simple in-memory session store for chat history
const sessionHistory: Record<string, any[]> = {};

export class GeminiService {
  static async handleChatStream(
    sessionId: string,
    question: string,
    datasetContext: any,
    currentFilters: any,
    currentState: any,
    onChunk: (chunk: string) => void
  ) {
    const ai = getGeminiClient();
    
    // Initialize or get history (limit to last 10 messages)
    if (!sessionHistory[sessionId]) {
      sessionHistory[sessionId] = [];
    }
    const history = sessionHistory[sessionId];

    let datasetData = datasetContext?.data || null;

    if (!datasetData) {
      try {
        let csvText = "";
        
        if (datasetContext?.storagePath && supabase) {
          console.log(`Downloading file from Supabase: ${datasetContext.storagePath}`);
          const { data, error } = await supabase.storage
            .from('insightiq-datasets')
            .download(datasetContext.storagePath);
            
          if (error) {
            throw new Error(`Supabase download error: ${error.message}`);
          }
          csvText = await data.text();
        } else if (datasetContext?.downloadURL) {
          console.log(`Downloading file from: ${datasetContext.downloadURL}`);
          let url = datasetContext.downloadURL;
          if (url.startsWith('/')) {
             throw new Error("Cannot fetch relative URL from server.");
          }
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.statusText}`);
          csvText = await res.text();
        }
        
        if (csvText) {
          const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
          if (parsed.errors.length && !parsed.data.length) {
            throw new Error(`CSV Parsing failed: ${parsed.errors[0].message}`);
          }
          datasetData = parsed.data;
          console.log('--- CSV LOADED ---');
          console.log(`Downloaded file: ${datasetContext?.name}`);
          console.log(`Rows parsed: ${datasetData.length}`);
          console.log(`Columns parsed: ${Object.keys(datasetData[0] || {}).length}`);
          
          // Update dataset context for prompt builder
          datasetContext.data = datasetData;
        }
      } catch (err: any) {
        console.error("Error downloading/parsing CSV:", err);
        throw new Error(`Failed to load dataset: ${err.message}`);
      }
    } else if (datasetData) {
      console.log('--- CSV LOADED ---');
      console.log('Dataset provided in request payload.');
      console.log(`Rows parsed: ${datasetData.length}`);
    }

    const systemPrompt = buildAiSystemPrompt(datasetContext, history, currentFilters, currentState);

    try {
      console.log('Model name: gemini-3.6-flash');
      console.log('Prompt length:', systemPrompt.length + question.length);
      console.log('Dataset size (rows):', datasetContext?.data?.length || 0);

      // Build contents array for multi-turn chat
      const contents: any[] = [];
      
      let filteredHistory = [...history];
      while (filteredHistory.length > 0 && filteredHistory[0].role !== 'user') {
        filteredHistory.shift();
      }

      for (const msg of filteredHistory) {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
      
      // Add current question
      contents.push({
        role: 'user',
        parts: [{ text: question }]
      });

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.6-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt
        }
      });

      let fullResponse = "";
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          onChunk(chunk.text);
        }
      }

      console.log('--- RESPONSE RECEIVED ---');
      console.log('Successfully completed Gemini stream');

      // Save to history
      history.push({ role: 'user', content: question });
      history.push({ role: 'model', content: fullResponse });

      // Keep only last 10
      if (history.length > 20) {
        sessionHistory[sessionId] = history.slice(history.length - 20);
      }
      
      return fullResponse;
    } catch (error: any) {
      console.error("Gemini stream error:", error);
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        throw new Error("You have exceeded your Gemini API quota. Please try again in a few moments.");
      }
      throw error;
    }
  }
}
