import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function testModel(modelName) {
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: "Hello"
    });
    console.log(`[SUCCESS] ${modelName}:`, res.text.substring(0, 30));
  } catch (err) {
    console.error(`[FAIL] ${modelName}:`, err.message);
  }
}
async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-2.0-flash-lite-preview-02-05');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-3.6-flash');
}
run();
