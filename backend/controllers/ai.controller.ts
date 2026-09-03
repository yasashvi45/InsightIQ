import { Request, Response } from "express";
import { GeminiService } from "../services/gemini.service";

export class AiController {
  static async chat(req: Request, res: Response) {
    try {
      const { sessionId, question, datasetContext, currentFilters, currentState } = req.body;

      console.log('--- BACKEND RECEIVED ---');
      console.log('Incoming request:', question);
      console.log('Dataset URL:', datasetContext?.downloadURL || 'N/A');
      console.log('Prompt:', question);

      if (!question) {
        return res.status(400).json({ success: false, error: "Question is required" });
      }
      
      const sId = sessionId || 'default_session';

      // Setup SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Check if API key is missing
      if (!process.env.GEMINI_API_KEY) {
        res.write(`data: ${JSON.stringify({ error: "Gemini API is not configured. Add GEMINI_API_KEY to the server environment." })}\n\n`);
        return res.end();
      }

      console.log('--- GEMINI CALLED ---');
      await GeminiService.handleChatStream(
        sId,
        question,
        datasetContext,
        currentFilters,
        currentState,
        (chunk) => {
          // Send each chunk
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      );

      // Send end event
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Chat controller error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || "Failed to generate response" })}\n\n`);
      res.end();
    }
  }
}
