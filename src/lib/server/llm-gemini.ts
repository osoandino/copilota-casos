import { gemini } from '$lib/server/gemini';

export async function refineWithGemini(prompt: string) {
  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt
  });

  return response.text || '';
}