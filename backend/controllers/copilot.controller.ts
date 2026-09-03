import { Request, Response } from "express";
import { getGeminiClient } from "../config/gemini.js";
import { Type } from "@google/genai";

export class CopilotController {
  static async analyze(req: Request, res: Response) {
    try {
      const { query, schema, metricsSummary, files, currency, history } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "Gemini API is not configured. Add GEMINI_API_KEY to the server environment." });
      }

      const ai = getGeminiClient();
      
      const systemPrompt = `You are InsightIQ Copilot, an expert business analyst and data scientist.
You interpret user queries and determine what data operations are needed, and generate rigorous, business-oriented insights based on provided metrics.

Task:
1. Determine the user's intent.
2. If the user asks for a chart, table, or calculation that requires iterating over the dataset, YOU MUST include an "operations" block to compute it locally. Choose the appropriate visualType (bar, line, pie, table, metric).
3. Generate a highly professional, structured markdown explanation.

CRITICAL RULES FOR RESPONSES:
1. DATA ACCURACY: DO NOT invent, hallucinate, or fabricate ANY numeric values. ONLY use data explicitly existing in the metricsSummary or files.
2. STRUCTURE & HEADINGS: Do NOT use ALL-CAPS headings. Use Sentence case or normal Title Case (e.g., "Executive summary", "Key metrics"). Use standard Markdown headings (#, ##, ###).
3. METRICS PRESENTATION: Do not bury metrics in long sentences. Present them clearly, e.g.:
**Total Revenue**
${currency || '$'}18,93,947

4. FORMATTING: Format monetary values using the provided currency symbol (${currency || '$'}). Format large numbers with commas consistently (e.g. 1,457,849 or Indian format 14,57,849 if applicable). Format percentages clearly (e.g. 76.97%).
5. TABLES FOR TOP ITEMS: For Top Products or Categories, ALWAYS use a Markdown table. The UI will render it as a responsive data grid. Provide Rank, Name, Value, and % Contribution.
6. ACTIONABLE INSIGHTS: Use the pattern:
   - **Finding:** [What the data shows]
   - **Business Impact:** [Why it matters]
   - **Action:** [What to do]
7. RECOMMENDATIONS: Make them specific, data-backed, and prioritized. Prefix with **[High Priority]**, **[Medium Priority]**, **[Risk]**, or **[Opportunity]**.
8. DATA QUALITY: Be objective (e.g., "Data completeness: 100%"). Do not overstate confidence.
9. MISSING DATA: Gracefully skip unavailable metrics. Do not say "Error". State "Not available" if directly asked.
10. LENGTH: Adapt to the question. Short for simple queries, detailed for open-ended analysis.

Columns available: ${JSON.stringify(schema)}
Metrics summary: ${JSON.stringify(metricsSummary)}`;

      const contents: any[] = [];
      
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      contents.push({ role: "user", parts: [{ text: query }] });

      if (files && files.length > 0) {
        for (const file of files) {
          contents[0].parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
          });
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING, description: "The intent of the user query" },
              visualType: { type: Type.STRING, description: "The type of visualization to generate" },
              explanation: { type: Type.STRING, description: "Markdown string containing your structured response" },
              operations: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING, description: "The metric to analyze" },
                  agg: { type: Type.STRING, description: "Aggregation function" },
                  groupBy: { type: Type.STRING, description: "The column to group by" },
                  sort: { type: Type.STRING, description: "Sort direction" },
                  limit: { type: Type.INTEGER, description: "Limit number of results" }
                }
              }
            }
          }
        }
      });

      let responseText = response.text || "{}";
      
      try {
        res.json(JSON.parse(responseText));
      } catch (e) {
        const sanitizedText = responseText.replace(/[\u0000-\u001F]+/g, (match) => {
           if (match.includes("\n")) return "\\n";
           if (match.includes("\r")) return "\\r";
           if (match.includes("\t")) return "\\t";
           return "";
        });
        res.json(JSON.parse(sanitizedText));
      }
    } catch (error: any) {
      console.error("Copilot controller error details:", error, "Stack:", error.stack);
      res.status(500).json({ error: error.message || "Failed to process query" });
    }
  }
}
