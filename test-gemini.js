import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'model', parts: [{ text: 'Hello' }] },
        { role: 'user', parts: [{ text: 'Hi' }] }
      ]
    });
    console.log('Success:', res.text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
