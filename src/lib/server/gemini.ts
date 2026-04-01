import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';

if (!GEMINI_API_KEY) {
  throw new Error('Falta GEMINI_API_KEY en .env');
}

export const gemini = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});