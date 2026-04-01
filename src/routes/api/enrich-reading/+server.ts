import { json } from '@sveltejs/kit';
import { gemini } from '$lib/server/gemini';
import { openai } from '$lib/server/openai';

function buildReadingPrompt(body: {
  caseData: {
    title?: string;
    community?: string;
    location?: string;
    dateStarted?: string;
    problemType?: string;
    affectedPeople?: string;
    status?: string;
    authorityContacted?: string;
    authorityResponse?: string;
    narrative?: string;
    evidence?: Array<{
      type?: string;
      name?: string;
      description?: string;
      gps?: string;
      date?: string;
    }>;
  };
  institutionRecommendation?: {
    primary?: string;
    secondary?: string;
    confidence?: string;
    reason?: string;
    nextStep?: string;
  } | null;
}) {
  const caseData = body.caseData || {};
  const evidence = caseData.evidence || [];

  const evidenceText =
    evidence.length > 0
      ? evidence
          .map(
            (e, i) => `
EVIDENCIA ${i + 1}
- Tipo: ${e.type || 'No especificado'}
- Nombre: ${e.name || 'No especificado'}
- Descripción: ${e.description || 'No especificada'}
- Fecha: ${e.date || 'No especificada'}
- GPS: ${e.gps || 'No especificado'}
`.trim()
          )
          .join('\n\n')
      : 'No hay evidencia registrada.';

  return `
Eres una asistente jurídico-operativa que analiza casos ambientales y comunitarios.

Debes devolver SOLO un objeto JSON válido, sin markdown ni texto adicional.

OBJETIVO
Analiza el caso y devuelve una lectura preliminar útil para orientar acción comunitaria e institucional.

FORMATO DE SALIDA
{
  "possible_affectations": ["..."],
  "dossier_state": "...",
  "critical_gaps": ["..."],
  "evidence_summary": "...",
  "inconsistencies": ["..."],
  "recommended_action": "...",
  "institutional_route_comment": "..."
}

REGLAS
1. No inventes hechos.
2. Si falta información, dilo claramente.
3. Sé prudente y operativo.
4. No cites normas si no fueron proporcionadas.
5. No salgas del JSON.

CASO
Título: ${caseData.title || 'Sin título'}
Comunidad: ${caseData.community || 'No especificada'}
Lugar: ${caseData.location || 'No especificado'}
Inicio del problema: ${caseData.dateStarted || 'No especificado'}
Tipo de problema: ${caseData.problemType || 'No especificado'}
Afectados: ${caseData.affectedPeople || 'No especificados'}
Estado: ${caseData.status || 'No especificado'}
Autoridad contactada: ${caseData.authorityContacted || 'No registrada'}
Respuesta institucional: ${caseData.authorityResponse || 'No registrada'}

RELATO
${caseData.narrative || 'Sin relato disponible.'}

EVIDENCIA
${evidenceText}

INSTITUCIÓN SUGERIDA
Principal: ${body.institutionRecommendation?.primary || 'No especificada'}
Alternativa: ${body.institutionRecommendation?.secondary || 'No especificada'}
Confianza: ${body.institutionRecommendation?.confidence || 'No especificada'}
Razón: ${body.institutionRecommendation?.reason || 'No especificada'}
Siguiente paso sugerido: ${body.institutionRecommendation?.nextStep || 'No especificado'}
`.trim();
}

function parseJSONObject(text: string) {
  const trimmed = (text || '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const codeFenceMatch =
    trimmed.match(/```json\s*([\s\S]*?)\s*```/i) ||
    trimmed.match(/```\s*([\s\S]*?)\s*```/i);

  if (codeFenceMatch?.[1]) {
    try {
      return JSON.parse(codeFenceMatch[1].trim());
    } catch {}
  }

  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch?.[0]) {
    return JSON.parse(objMatch[0]);
  }

  throw new Error('La respuesta del modelo no vino como un objeto JSON válido.');
}

export async function POST({ request }) {
  try {
    const body = await request.json();

    if (!body?.caseData) {
      return json({ ok: false, error: 'Falta caseData.' }, { status: 400 });
    }

    const provider = body?.provider || 'gemini';
    const prompt = buildReadingPrompt(body);

    if (provider === 'openai') {
      try {
        const response = await openai.responses.create({
          model: 'gpt-4.1-mini',
          input: prompt,
          safety_identifier: body?.safety_identifier || 'copilota-anon'
        });

        const parsed = parseJSONObject(response.output_text || '{}');

        return json({
          ok: true,
          provider: 'openai',
          output: parsed
        });
      } catch (error: any) {
        console.error('enrich-reading openai error:', error);
        return json(
          {
            ok: false,
            provider: 'openai',
            error: error?.message || 'OpenAI no pudo enriquecer la lectura.'
          },
          { status: error?.status || 500 }
        );
      }
    }

    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt
      });

      const parsed = parseJSONObject(response.text || '{}');

      return json({
        ok: true,
        provider: 'gemini',
        output: parsed
      });
    } catch (error: any) {
      console.error('enrich-reading gemini error:', error);
      return json(
        {
          ok: false,
          provider: 'gemini',
          error: error?.message || 'Gemini no pudo enriquecer la lectura.'
        },
        { status: error?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('enrich-reading general error:', error);
    return json(
      {
        ok: false,
        error: error?.message || 'Error al enriquecer la lectura.'
      },
      { status: error?.status || 500 }
    );
  }
}