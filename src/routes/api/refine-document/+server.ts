import { json } from '@sveltejs/kit';
import { gemini } from '$lib/server/gemini';
import { openai } from '$lib/server/openai';
import { normativeSeed } from '$lib/data/normativeSeed';
import type { DocumentUseKey } from '$lib/types/normative';
import {
  matchDocumentUseKeyFromName,
  getDocumentPriorityFunctions,
  getDocumentSpecificInstruction
} from '$lib/config/documentRegistry';

type NormativeMatchInput = {
  normativeSourceId: string;
  selectedForUse: boolean;
  selectedForDocuments: string[];
  functionInCase?: string;
  rationale?: string;
  caution?: string;
  relevance?: string;
};

type SelectedNormForRefine = {
  id: string;
  title: string;
  article: string;
  excerpt: string;
  validityStatus: string;
  functionInCase: string;
  rationale: string;
  caution: string;
  relevance: string;
  priorityScore: number;
};

const DEFAULT_PRIORITY_FUNCTIONS = [
  'derecho_ambiental',
  'derecho_al_agua',
  'participacion',
  'control_social'
] as const;

const DEFAULT_DOCUMENT_INSTRUCTION = `
TIPO DOCUMENTAL: GENERAL

INSTRUCCIONES ESPECÍFICAS
- Reescribe el documento para que quede claro, sobrio y usable.
- Integra la base normativa solo si fue seleccionada para este documento.
- No inventes hechos, competencias, procedimientos ni autoridades.
`.trim();

function getDocumentUseKey(documentName: string): DocumentUseKey | null {
  return matchDocumentUseKeyFromName(documentName);
}

function getPriorityFunctionsForDocumentName(documentName: string): string[] {
  const docUseKey = getDocumentUseKey(documentName);
  return docUseKey ? getDocumentPriorityFunctions(docUseKey) : [...DEFAULT_PRIORITY_FUNCTIONS];
}

function getSpecificInstructionForDocumentName(documentName: string): string {
  const docUseKey = getDocumentUseKey(documentName);
  return docUseKey
    ? getDocumentSpecificInstruction(docUseKey)
    : DEFAULT_DOCUMENT_INSTRUCTION;
}

function getSelectedNormsForDocument(payload: {
  options: {
    documentName: string;
    caseData: {
      normativeMatches?: NormativeMatchInput[];
    };
  };
}): SelectedNormForRefine[] {
  const docUseKey = getDocumentUseKey(payload.options.documentName);
  if (!docUseKey) return [];

  const matches = payload.options.caseData.normativeMatches || [];
  const priorityFunctions = getDocumentPriorityFunctions(docUseKey);

  const enriched = matches
    .filter(
      (m) =>
        m.selectedForUse &&
        Array.isArray(m.selectedForDocuments) &&
        m.selectedForDocuments.includes(docUseKey)
    )
    .map((m): SelectedNormForRefine | null => {
      const source = normativeSeed.find((n) => n.id === m.normativeSourceId);
      if (!source) return null;

      const fn = m.functionInCase || 'fundamento';
      const relevance = (m.relevance || 'media').toLowerCase();

      let priorityScore = 0;

      const idx = priorityFunctions.indexOf(fn);
      if (idx >= 0) {
        priorityScore += 20 - idx;
      }

      if (relevance === 'alta') priorityScore += 6;
      else if (relevance === 'media') priorityScore += 3;

      if ((source.validityStatus || '').toLowerCase() === 'verificada') {
        priorityScore += 1;
      }

      return {
        id: source.id,
        title: source.normTitle || '',
        article: source.article || '',
        excerpt: source.excerpt || '',
        validityStatus: source.validityStatus || '',
        functionInCase: fn,
        rationale: m.rationale || '',
        caution: m.caution || '',
        relevance,
        priorityScore
      };
    })
    .filter((item): item is SelectedNormForRefine => item !== null)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return enriched;
}

function buildRefinePrompt(payload: {
  baseContent: string;
  options: {
    documentName: string;
    tone: string;
    audience: string;
    variant: string;
    caseData: {
      id?: string;
      title?: string;
      community?: string;
      location?: string;
      problemType?: string;
      affectedPeople?: string;
      status?: string;
      authorityContacted?: string;
      authorityResponse?: string;
      narrative?: string;
      normativeMatches?: NormativeMatchInput[];
    };
    institutionRecommendation?: {
      primary?: string;
      secondary?: string;
      reason?: string;
      nextStep?: string;
    } | null;
    operationalPrimaryCandidate?: {
      label?: string;
      shortDescription?: string;
    } | null;
    operationalSecondaryCandidates?: Array<{
      label?: string;
      shortDescription?: string;
    }>;
  };
}) {
  const { baseContent, options } = payload;
  const {
    documentName,
    tone,
    audience,
    variant,
    caseData,
    institutionRecommendation,
    operationalPrimaryCandidate,
    operationalSecondaryCandidates
  } = options;

  const selectedNorms = getSelectedNormsForDocument(payload);
  const priorityFunctions = getPriorityFunctionsForDocumentName(documentName);
  const docSpecificInstruction = getSpecificInstructionForDocumentName(documentName);

  const normsText =
    selectedNorms.length > 0
      ? selectedNorms
          .map(
            (n, i) => `
NORMA ${i + 1}
Título: ${n.title}
Artículo: ${n.article}
Estado: ${n.validityStatus}
Relevancia: ${n.relevance}
Función en el caso: ${n.functionInCase}
Texto relevante: ${n.excerpt}
Razón de pertinencia: ${n.rationale}
Cautela: ${n.caution}
`.trim()
          )
          .join('\n\n')
      : 'No hay normas seleccionadas específicamente para este documento.';

  const secondaryPatterns =
    (operationalSecondaryCandidates || []).length > 0
      ? (operationalSecondaryCandidates || [])
          .map(
            (p, i) =>
              `${i + 1}. ${p.label || 'Patrón secundario'} - ${p.shortDescription || ''}`
          )
          .join('\n')
      : 'No se identificaron patrones secundarios relevantes.';

  return `
Eres una asistente de redacción jurídico-comunitaria para expedientes ambientales y territoriales.

Tu tarea es reescribir y fortalecer un documento base para que quede profesional, claro, usable y mejor fundamentado, sin inventar hechos ni inventar derecho.

OBJETIVO
Debes producir una versión final lista para revisión humana, con redacción seria, clara, sobria y con mejor sustento normativo cuando exista base normativa seleccionada para este documento.

REGLAS OBLIGATORIAS
1. Usa únicamente la información proporcionada.
2. No inventes hechos, fechas, lugares, instituciones, competencias ni evidencia.
3. No cites leyes, reglamentos, artículos ni normas fuera del bloque de normas seleccionadas.
4. Si hay normas seleccionadas para este documento, debes integrarlas en el cuerpo del texto de forma útil y natural.
5. No te limites a copiar una sección final de normas: úsalas para dar fundamento al documento.
6. Usa primero las normas cuya función en el caso sea más pertinente para este tipo documental.
7. Si varias normas existen, prioriza las funciones jurídicas más relevantes y usa las demás como apoyo.
8. No afirmes responsabilidad legal definitiva.
9. Usa formulaciones prudentes.
10. No uses markdown.
11. No uses asteriscos, tablas ni adornos.
12. No escribas explicaciones previas ni posteriores.
13. Devuelve solo el texto final del documento.
14. Mantén un tono ${tone || 'institucional'}.
15. Adapta el documento al destinatario: ${audience || 'autoridad competente'}.
16. Produce una versión ${variant || 'estándar'}.
17. Conserva la finalidad del documento: ${documentName || 'Documento'}.

FUNCIONES JURÍDICAS PRIORITARIAS PARA ESTE DOCUMENTO
${priorityFunctions.join(', ')}

${docSpecificInstruction}

DATOS DEL CASO
Título: ${caseData?.title || 'Sin título'}
Comunidad: ${caseData?.community || 'Pendiente'}
Lugar: ${caseData?.location || 'Pendiente'}
Problema principal: ${caseData?.problemType || 'Pendiente'}
Afectados: ${caseData?.affectedPeople || 'Pendiente'}
Estado: ${caseData?.status || 'Pendiente'}
Autoridad contactada: ${caseData?.authorityContacted || 'No registrada'}
Respuesta institucional: ${caseData?.authorityResponse || 'No registrada'}

RELATO
${caseData?.narrative || 'Sin relato'}

RUTA OPERATIVA
Patrón principal: ${operationalPrimaryCandidate?.label || 'No identificado'}
Descripción del patrón principal: ${
    operationalPrimaryCandidate?.shortDescription || 'No disponible'
  }

Patrones secundarios:
${secondaryPatterns}

INSTITUCIÓN SUGERIDA
Principal: ${institutionRecommendation?.primary || 'No especificada'}
Alternativa: ${institutionRecommendation?.secondary || 'No especificada'}
Razón: ${institutionRecommendation?.reason || 'No especificada'}
Siguiente paso sugerido: ${institutionRecommendation?.nextStep || 'No especificado'}

NORMAS SELECCIONADAS PARA ESTE DOCUMENTO
${normsText}

DOCUMENTO BASE
${baseContent || ''}
`.trim();
}

async function refineWithGemini(prompt: string) {
  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt
  });

  return (response.text || '').trim();
}

async function refineWithOpenAI(prompt: string, safetyIdentifier: string) {
  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt,
    safety_identifier: safetyIdentifier
  });

  return (response.output_text || '').trim();
}

export async function POST({ request }) {
  try {
    const body = await request.json();

    if (!body?.baseContent || !body?.options) {
      return json(
        { ok: false, error: 'Faltan baseContent u options.' },
        { status: 400 }
      );
    }

    const provider = body?.provider || 'gemini';
    const prompt = buildRefinePrompt(body);
    const safetyIdentifier = body?.safety_identifier || 'copilota-anon';

    if (provider === 'openai') {
      try {
        const output = await refineWithOpenAI(prompt, safetyIdentifier);

        return json({
          ok: true,
          provider: 'openai',
          output
        });
      } catch (error: any) {
        console.error('refine-document openai error:', error);

        return json(
          {
            ok: false,
            provider: 'openai',
            error: error?.message || 'OpenAI no pudo refinar el documento.'
          },
          { status: error?.status || 500 }
        );
      }
    }

    const output = await refineWithGemini(prompt);

    return json({
      ok: true,
      provider: 'gemini',
      output
    });
  } catch (error: any) {
    console.error('refine-document general error:', error);

    return json(
      {
        ok: false,
        error:
          error?.message ||
          'Error al refinar el documento con el proveedor seleccionado.'
      },
      { status: error?.status || 500 }
    );
  }
}