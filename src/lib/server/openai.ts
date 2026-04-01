import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

if (!OPENAI_API_KEY) {
  throw new Error('Falta OPENAI_API_KEY en .env');
}

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});