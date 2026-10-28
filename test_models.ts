import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/Jahid/Desktop/ANTIGRAVITY/viral-clip-studio/.env' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const candidates = [
  'gemini-3.8-flash',
  'gemini-3.8-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

async function testModel(model) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: 'Respond with just "OK"'
    });
    console.log(`[SUCCESS] ${model}:`, res.text?.trim());
    return true;
  } catch (e) {
    console.log(`[FAILED] ${model}:`, e.message);
    return false;
  }
}

(async () => {
  for (const m of candidates) {
    await testModel(m);
  }
})();
