import { json } from '@sveltejs/kit';
import { gemini } from '$lib/server/gemini';
import { openai } from '$lib/server/openai';
import { normativeSeed } from '$lib/data/normativeSeed';
import type { DocumentUseKey } from '$lib/types/normative';

function mapDocNameToUseKey(docName: string): DocumentUseKey | null {
  const normalized = (docName || '').toLowerCase();

  if (normalized.includes('ficha')) return 'ficha_resumen';
  if (normalized.includes('inspección') || normalized.includes('inspeccion')) {
    return 'solicitud_inspeccion';
  }
  if (normalized.includes('información') || normalized.includes('informacion')) {
    return 'solicitud_informacion';
  }
  if (normalized.includes('seguimiento')) return 'nota_seguimiento';
  if (normalized.includes('acta')) return 'acta_comunitaria';
  if (normalized.includes('cronología') || normalized.includes('cronologia')) {
    return 'cronologia';
  }
  if (normalized.includes('alt')) return 'presentacion_alt';
  if (normalized.includes('defensoría') || normalized.includes('defensoria')) {
    return 'presentacion_defensoria';
  }

  return null;
}

function getPriorityFunctionsForDocument(documentName: string): string[] {
  const normalized = (documentName || '').toLowerCase();

  if (
    normalized.includes('solicitud de información') ||
    normalized.includes('solicitud de informacion')
  ) {
    return [
      'acceso_informacion',
      'transparencia_activa',
      'derecho_peticion',
      'seguimiento_omision',
      'control_social'
    ];
  }

  if (
    normalized.includes('solicitud de inspección') ||
    normalized.includes('solicitud de inspeccion')
  ) {
    return [
      'inspeccion_fiscalizacion',
      'competencia_municipal',
      'competencia_ambiental',
      'gestion_riesgos',
      'salud_publica',
      'derecho_ambiental',
      'derecho_al_agua'
    ];
  }

  if (normalized.includes('defensoría') || normalized.includes('defensoria')) {
    return [
      'proteccion_defensoras',
      'seguimiento_omision',
      'acceso_justicia_ambiental',
      'derecho_ambiental',
      'derecho_al_agua',
      'participacion',
      'control_social'
    ];
  }

  if (normalized.includes('alt')) {
    return [
      'competencia_alt',
      'competencia_binacional',
      'ruta_binacional',
      'soporte_tecnico',
      'coordinacion_interinstitucional',
      'derecho_al_agua',
      'fundamento_ecosistemico'
    ];
  }

  return [
    'derecho_ambiental',
    'derecho_al_agua',
    'participacion',
    'control_social'
  ];
}

function getSelectedNormsForDocument(payload: {
  options: {
    documentName: string;
    caseData: {
      normativeMatches?: Array<{
        normativeSourceId: string;
        selectedForUse: boolean;
        selectedForDocuments: string[];
        functionInCase?: string;
        rationale?: string;
        caution?: string;
        relevance?: string;
      }>;
    };
  };
}) {
  const docUseKey = mapDocNameToUseKey(payload.options.documentName);
  if (!docUseKey) return [];

  const matches = payload.options.caseData.normativeMatches || [];
  const priorityFunctions = getPriorityFunctionsForDocument(
    payload.options.documentName
  );

  const enriched = matches
    .filter(
      (m) =>
        m.selectedForUse &&
        Array.isArray(m.selectedForDocuments) &&
        m.selectedForDocuments.includes(docUseKey)
    )
    .map((m) => {
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
        title: source.normTitle,
        article: source.article,
        excerpt: source.excerpt,
        validityStatus: source.validityStatus,
        functionInCase: fn,
        rationale: m.rationale || '',
        caution: m.caution || '',
        relevance,
        priorityScore
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.priorityScore || 0) - (a?.priorityScore || 0));

  return enriched;
}

function getDocumentSpecificInstruction(documentName: string) {
  const normalized = (documentName || '').toLowerCase();

  if (
    normalized.includes('solicitud de información') ||
    normalized.includes('solicitud de informacion')
  ) {
    return `
TIPO DOCUMENTAL: SOLICITUD DE INFORMACIÓN

FINALIDAD
Este documento debe pedir información concreta, identificable y útil para abrir, fortalecer o aclarar el expediente.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono formal, claro y administrativo.
- Organiza la información requerida en puntos numerados.
- Prioriza pedidos verificables: informes, inspecciones, monitoreos, licencias, cronogramas, responsables, antecedentes y medidas adoptadas.
- Da prioridad a normas cuya función sea acceso_informacion, transparencia_activa, derecho_peticion, seguimiento_omision o control_social.
- Si hay base normativa seleccionada, úsala para reforzar el deber de informar y responder.
- No exageres ni acuses.
- No conviertas este documento en una denuncia agresiva.
`.trim();
  }

  if (
    normalized.includes('solicitud de inspección') ||
    normalized.includes('solicitud de inspeccion')
  ) {
    return `
TIPO DOCUMENTAL: SOLICITUD DE INSPECCIÓN

FINALIDAD
Este documento debe pedir actuación concreta e inmediata de verificación técnica en sitio.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono formal, operativo y preciso.
- Mantén foco en hechos verificables, lugar, afectación observada y evidencia disponible.
- El petitorio debe incluir inspección en sitio, verificación técnica y, si corresponde, constatación de descargas, rebalses, residuos, afectación hídrica o toma de muestras.
- Da prioridad a normas cuya función sea inspeccion_fiscalizacion, competencia_municipal, competencia_ambiental, gestion_riesgos o salud_publica.
- No conviertas el documento en una denuncia penal ni en una carta política.
`.trim();
  }

  if (normalized.includes('defensoría') || normalized.includes('defensoria')) {
    return `
TIPO DOCUMENTAL: PRESENTACIÓN A LA DEFENSORÍA DEL PUEBLO

FINALIDAD
Este documento debe comunicar una posible afectación de derechos y/o una omisión institucional, solicitando intervención, seguimiento, exhortación u orientación.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono formal, sobrio y de tutela de derechos.
- Enfatiza la afectación de personas, comunidad o colectivos.
- Resume las gestiones previas y deja claro si hubo falta de respuesta, respuesta insuficiente o persistencia del problema.
- Da prioridad a normas cuya función sea proteccion_defensoras, seguimiento_omision, acceso_justicia_ambiental, derecho_ambiental, derecho_al_agua o participacion.
- El petitorio debe pedir intervención, seguimiento, requerimiento de información, exhortación o acompañamiento, según corresponda.
- No conviertas el texto en demanda judicial.
`.trim();
  }

  if (normalized.includes('alt')) {
    return `
TIPO DOCUMENTAL: PRESENTACIÓN A LA ALT

FINALIDAD
Este documento debe poner en conocimiento un caso con relevancia hídrica, lacustre, sistémica o binacional, solicitando atención técnica, seguimiento o articulación institucional.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono técnico-institucional, respetuoso y claro.
- Enfatiza la dimensión hídrica, lacustre, territorial o sistémica del caso.
- Explica por qué el caso puede requerir atención, conocimiento técnico o articulación en el marco del sistema TDPS.
- Da prioridad a normas cuya función sea competencia_alt, competencia_binacional, ruta_binacional, soporte_tecnico o coordinacion_interinstitucional.
- No conviertas el texto en una denuncia emocional.
- El petitorio debe pedir consideración técnica, información sobre antecedentes, monitoreo, coordinación o seguimiento institucional, según corresponda.
`.trim();
  }

  return `
TIPO DOCUMENTAL: GENERAL

INSTRUCCIONES ESPECÍFICAS
- Reescribe el documento para que quede claro, sobrio y usable.
- Integra la base normativa solo si fue seleccionada para este documento.
- No inventes hechos, competencias, procedimientos ni autoridades.
`.trim();
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
      normativeMatches?: Array<{
        normativeSourceId: string;
        selectedForUse: boolean;
        selectedForDocuments: string[];
        functionInCase?: string;
        rationale?: string;
        caution?: string;
        relevance?: string;
      }>;
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
  const priorityFunctions = getPriorityFunctionsForDocument(documentName);
  const docSpecificInstruction = getDocumentSpecificInstruction(documentName);

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