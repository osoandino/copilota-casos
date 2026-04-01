import type { CaseRecord } from '$lib/types/case';
import type { InstitutionRecommendation } from '$lib/logic/actionRoute';
import type { GeneratedDocument } from '$lib/documents/generateDocuments';

export type RefinedVariant = {
  key: string;
  label: string;
  tone: string;
  audience: string;
  variant: string;
  content: string;
};

function summarizeEvidence(data: CaseRecord): string {
  if (!data.evidence || data.evidence.length === 0) {
    return 'No se registró evidencia adjunta todavía.';
  }

  return data.evidence
    .slice(0, 5)
    .map((e, i) => `${i + 1}. ${e.type}: ${e.description || e.name || 'sin detalle'}`)
    .join(' ');
}

export function refineDocumentLocally(
  baseContent: string,
  options: {
    documentName: string;
    tone: string;
    audience: string;
    variant: string;
    caseData: CaseRecord;
    institutionRecommendation: InstitutionRecommendation | null;
  }
): string {
  const {
    documentName,
    tone = 'institucional',
    audience = 'autoridad local',
    variant = 'estándar',
    caseData,
    institutionRecommendation
  } = options;

  const greetingByTone: Record<string, string> = {
    institucional: `A la atención de ${institutionRecommendation?.primary || audience}:`,
    claro: `Presentamos el siguiente caso ante ${institutionRecommendation?.primary || audience}:`,
    comunitario_formal: `Como comunidad, ponemos en su conocimiento el siguiente caso ante ${institutionRecommendation?.primary || audience}:`
  };

  const closingByTone: Record<string, string> = {
    institucional:
      'Solicitamos una atención oportuna, respuesta formal y las acciones que correspondan dentro de su competencia.',
    claro:
      'Pedimos una respuesta clara, una revisión del caso y acciones concretas.',
    comunitario_formal:
      'Pedimos atención respetuosa, seguimiento y respuesta sobre las medidas que se tomarán.'
  };

  const variantInstruction: Record<string, string> = {
    estándar: 'Se mantiene una estructura completa y sobria.',
    breve: 'Se prioriza síntesis, claridad y lectura rápida.',
    detallada: 'Se enfatizan contexto, afectación, evidencia y solicitud.'
  };

  const header = [
    `${documentName.toUpperCase()} — VERSIÓN REFINADA`,
    '',
    greetingByTone[tone] || greetingByTone.institucional,
    '',
    `Documento orientado a: ${audience}.`,
    `Criterio de redacción: ${variantInstruction[variant] || variantInstruction.estándar}`,
    ''
  ].join('\n');

  const contextBlock = [
    `Caso: ${caseData.title || 'Sin título'}`,
    `Comunidad: ${caseData.community || 'Pendiente'}`,
    `Lugar: ${caseData.location || 'Pendiente'}`,
    `Problema principal: ${caseData.problemType || 'Pendiente'}`,
    `Afectados: ${caseData.affectedPeople || 'Pendiente'}`,
    ''
  ].join('\n');

  const institutionBlock = [
    `Institución sugerida: ${institutionRecommendation?.primary || 'Pendiente'}`,
    institutionRecommendation?.reason
      ? `Fundamento de la ruta: ${institutionRecommendation.reason}`
      : '',
    ''
  ].join('\n');

  const evidenceBlock =
    variant === 'breve'
      ? `Evidencia resumida: ${summarizeEvidence(caseData)}`
      : ['Evidencia resumida:', summarizeEvidence(caseData), ''].join('\n');

  let body = baseContent;

  if (variant === 'breve') {
    body = [
      caseData.narrative || '[Relato pendiente]',
      '',
      'Solicitud principal: se pide atención y respuesta institucional.'
    ].join('\n');
  }

  if (variant === 'detallada') {
    body = [
      'Contexto ampliado del caso:',
      caseData.narrative || '[Relato pendiente]',
      '',
      'Hechos relevantes para la presentación:',
      `- Problema identificado: ${caseData.problemType || 'Pendiente'}`,
      `- Lugar afectado: ${caseData.location || '[pendiente]'}`,
      `- Personas o grupos afectados: ${caseData.affectedPeople || '[pendiente]'}`,
      `- Estado del caso: ${caseData.status}`,
      '',
      baseContent
    ].join('\n');
  }

  const closing = [
    '',
    closingByTone[tone] || closingByTone.institucional,
    `Fecha de refinamiento: ${new Date().toLocaleString()}`,
    'Nota: versión asistida por IA local/reglas; requiere revisión humana antes de su uso formal.'
  ].join('\n');

  return [header, contextBlock, institutionBlock, evidenceBlock, body, closing].join('\n');
}

export function buildRefinedDocumentVariants(
  doc: GeneratedDocument,
  caseData: CaseRecord,
  institutionRecommendation: InstitutionRecommendation | null
): RefinedVariant[] {
  const configs = [
    {
      key: 'institucional_estandar',
      label: 'Institucional',
      tone: 'institucional',
      audience: institutionRecommendation?.primary || 'autoridad local',
      variant: 'estándar'
    },
    {
      key: 'claro_breve',
      label: 'Claro y breve',
      tone: 'claro',
      audience: institutionRecommendation?.primary || 'autoridad local',
      variant: 'breve'
    },
    {
      key: 'comunitario_detallado',
      label: 'Comunitario-formal',
      tone: 'comunitario_formal',
      audience: institutionRecommendation?.primary || 'autoridad local',
      variant: 'detallada'
    }
  ];

  return configs.map((cfg) => ({
    ...cfg,
    content: refineDocumentLocally(doc.content, {
      documentName: doc.name,
      tone: cfg.tone,
      audience: cfg.audience,
      variant: cfg.variant,
      caseData,
      institutionRecommendation
    })
  }));
}