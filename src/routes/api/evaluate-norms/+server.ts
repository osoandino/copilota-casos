import { json } from '@sveltejs/kit';
import { gemini } from '$lib/server/gemini';
import { openai } from '$lib/server/openai';

function extractJSONArray(text: string) {
  const trimmed = (text || '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // seguir intentando
  }

  const codeFenceMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i) || trimmed.match(/```\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    try {
      return JSON.parse(codeFenceMatch[1].trim());
    } catch {
      // seguir intentando
    }
  }

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch?.[0]) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // seguir intentando
    }
  }

  throw new Error('La respuesta del modelo no vino como un arreglo JSON válido.');
}

export async function POST({ request }) {
  try {
    const body = await request.json();

    if (!body?.prompt) {
      return json({ ok: false, error: 'Falta prompt.' }, { status: 400 });
    }

    const provider = body?.provider || 'gemini';

    if (provider === 'openai') {
      try {
        const response = await openai.responses.create({
          model: 'gpt-4.1-mini',
          input: body.prompt,
          safety_identifier: body?.safety_identifier || 'copilota-anon'
        });

        const parsed = extractJSONArray(response.output_text || '[]');

        return json({
          ok: true,
          provider: 'openai',
          output: parsed
        });
      } catch (error: any) {
        console.error('evaluate-norms openai error:', error);
        return json(
          {
            ok: false,
            provider: 'openai',
            error: error?.message || 'OpenAI no pudo valorar las normas.'
          },
          { status: error?.status || 500 }
        );
      }
    }

    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: body.prompt
      });

      const rawText = response.text || '';
      const parsed = extractJSONArray(rawText);

      return json({
        ok: true,
        provider: 'gemini',
        output: parsed
      });
    } catch (error: any) {
      console.error('evaluate-norms gemini error:', error);
      return json(
        {
          ok: false,
          provider: 'gemini',
          error: error?.message || 'Gemini no pudo valorar las normas.'
        },
        { status: error?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('evaluate-norms general error:', error);
    return json(
      {
        ok: false,
        error: error?.message || 'Error al valorar normas.'
      },
      { status: error?.status || 500 }
    );
  }
}