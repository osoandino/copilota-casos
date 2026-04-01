import type { CaseRecord } from '$lib/types/case';
import type {
  CaseNormativeAnalysis,
  CaseNormativeMatch,
  NormativeSource
} from '$lib/types/normative';

function normalize(text: string) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function includesAny(text: string, terms: string[]) {
  const t = normalize(text);
  return terms.some((term) => t.includes(normalize(term)));
}

function uniqueById(items: NormativeSource[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function buildCaseText(caseData: CaseRecord) {
  return normalize(
    [
      caseData.title,
      caseData.narrative,
      caseData.problemType,
      caseData.community,
      caseData.location,
      caseData.affectedPeople,
      caseData.authorityContacted,
      caseData.authorityResponse,
      ...(caseData.evidence || []).map((e) =>
        [e.type, e.name, e.description, e.gps, e.date].filter(Boolean).join(' ')
      )
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function detectThemes(caseData: CaseRecord) {
  const text = buildCaseText(caseData);
  const themes: string[] = [];
  const rights: string[] = [];
  const institutions: string[] = [];
  const procedures: string[] = [];
  const retrievalKeywords: string[] = [];

  if (includesAny(text, ['agua', 'lago', 'bahia', 'cohana', 'katari', 'tdps'])) {
    themes.push('agua', 'contaminacion hidrica');
    rights.push('agua', 'medio ambiente');
    institutions.push('municipio', 'autoridad ambiental', 'alt');
    retrievalKeywords.push('agua', 'contaminacion', 'alt', 'tdps', 'binacional');
  }

  if (includesAny(text, ['aguas servidas', 'descarga', 'descargas', 'ptar', 'alcantarillado'])) {
    themes.push('aguas residuales', 'saneamiento');
    rights.push('salud', 'agua');
    institutions.push('municipio', 'epsa', 'autoridad ambiental');
    procedures.push('inspeccion', 'fiscalizacion');
    retrievalKeywords.push('aguas residuales', 'ptar', 'alcantarillado');
  }

  if (
    includesAny(text, [
      'residuo',
      'residuos',
      'basura',
      'botadero',
      'quema',
      'microbasural',
      'microbasurales',
      'lixiviado',
      'lixiviados',
      'vertedero'
    ])
  ) {
    themes.push('residuos');
    rights.push('medio ambiente', 'salud');
    institutions.push('municipio', 'autoridad ambiental');
    procedures.push('inspeccion', 'fiscalizacion');
    retrievalKeywords.push(
      'residuos',
      'botadero',
      'quema',
      'microbasurales',
      'lixiviados'
    );
  }

  if (
    includesAny(text, [
      'sustancia peligrosa',
      'sustancias peligrosas',
      'quimico',
      'quimica',
      'química',
      'toxico',
      'tóxico',
      'derrame',
      'combustible',
      'hidrocarburo',
      'veneno',
      'reactivo'
    ])
  ) {
    themes.push('sustancias peligrosas', 'riesgo quimico');
    rights.push('salud', 'medio ambiente', 'seguridad');
    institutions.push('autoridad ambiental', 'municipio', 'gobernacion');
    procedures.push('inspeccion', 'fiscalizacion', 'medidas urgentes');
    retrievalKeywords.push(
      'sustancias peligrosas',
      'riesgo quimico',
      'derrame',
      'toxico'
    );
  }

  if (
    includesAny(text, [
      'amenaza',
      'amenazas',
      'hostigamiento',
      'represalia',
      'represalias',
      'defensora',
      'defensoras',
      'lideresa',
      'lideresas',
      'intimidacion',
      'intimidación',
      'acoso'
    ])
  ) {
    themes.push('defensoras');
    rights.push('proteccion', 'participacion', 'integridad', 'seguridad');
    institutions.push('defensoria', 'fiscalia', 'policia');
    procedures.push('proteccion', 'seguimiento', 'acompanamiento');
    retrievalKeywords.push(
      'defensoras',
      'escazu',
      'proteccion',
      'defensoria',
      'hostigamiento'
    );
  }

  if (
    includesAny(text, [
      'sin respuesta',
      'no respondio',
      'no respondió',
      'sin acciones',
      'omision',
      'omisión',
      'no informaron',
      'no fueron informados'
    ])
  ) {
    themes.push('omision institucional');
    rights.push('peticion', 'acceso a informacion');
    institutions.push('defensoria', 'entidad publica');
    procedures.push('seguimiento', 'solicitud de informacion');
    retrievalKeywords.push('omision', 'peticion', 'informacion', 'escazu', 'seguimiento');
  }

  if (
    includesAny(text, [
      'informacion',
      'información',
      'informe',
      'monitoreo',
      'licencia',
      'auditoria',
      'auditoría',
      'cronograma',
      'respuesta escrita',
      'antecedentes'
    ])
  ) {
    themes.push('informacion ambiental');
    rights.push('acceso a informacion');
    institutions.push('entidad publica', 'defensoria', 'alt');
    procedures.push('solicitud de informacion');
    retrievalKeywords.push('informacion ambiental', 'escazu', 'transparencia', 'respuesta');
  }

  if (
    includesAny(text, [
      'consulta',
      'participacion',
      'participación',
      'territorio',
      'pueblos indigenas',
      'pueblos indígenas'
    ])
  ) {
    themes.push('participacion', 'territorio');
    rights.push('participacion', 'consulta');
    institutions.push('defensoria', 'estado');
    procedures.push('consulta', 'acta comunitaria');
    retrievalKeywords.push('participacion', 'consulta', 'escazu', 'territorio');
  }

  return {
    themes: [...new Set(themes)],
    rights: [...new Set(rights)],
    institutions: [...new Set(institutions)],
    procedures: [...new Set(procedures)],
    retrievalKeywords: [...new Set(retrievalKeywords)]
  };
}

function isEscazuNorm(norm: NormativeSource) {
  const haystack = normalize(
    [norm.id, norm.normTitle, norm.article, ...(norm.themeTags || []), norm.notes || ''].join(' ')
  );
  return includesAny(haystack, ['escazu', 'acuerdo de escazu']);
}

function isAltNorm(norm: NormativeSource) {
  const haystack = normalize(
    [
      norm.id,
      norm.normTitle,
      norm.article,
      ...(norm.themeTags || []),
      ...(norm.institutionTags || []),
      ...(norm.territorialTags || []),
      norm.notes || ''
    ].join(' ')
  );
  return includesAny(haystack, ['alt', 'tdps', 'binacional', 'sistema hidrico']);
}

function isConstitutionalNorm(norm: NormativeSource) {
  const haystack = normalize(
    [norm.jurisdictionLevel, norm.normType, norm.normTitle].join(' ')
  );
  return includesAny(haystack, ['constitucion', 'constitucional']);
}

function isEnvironmentalRegulation(norm: NormativeSource) {
  const haystack = normalize(
    [
      norm.jurisdictionLevel,
      norm.normType,
      norm.normTitle,
      ...(norm.themeTags || [])
    ].join(' ')
  );
  return includesAny(haystack, [
    'reglamento',
    'ley 1333',
    'gestion ambiental',
    'contaminacion hidrica',
    'prevencion',
    'control ambiental',
    'residuos',
    'sustancias peligrosas'
  ]);
}

function isWaterSectorNorm(norm: NormativeSource) {
  const haystack = normalize(
    [
      norm.normTitle,
      norm.article,
      ...(norm.themeTags || []),
      ...(norm.rightsTags || []),
      norm.notes || ''
    ].join(' ')
  );
  return includesAny(haystack, [
    'agua',
    'alcantarillado',
    'servicios de agua',
    'ptar',
    'contaminacion hidrica'
  ]);
}

function isDefensoriaNorm(norm: NormativeSource) {
  const haystack = normalize(
    [
      norm.normTitle,
      norm.article,
      ...(norm.themeTags || []),
      ...(norm.institutionTags || []),
      norm.notes || ''
    ].join(' ')
  );

  return includesAny(haystack, [
    'defensoria',
    'derechos humanos',
    'proteccion',
    'defensoras',
    'hostigamiento'
  ]);
}

function scoreNorm(caseData: CaseRecord, norm: NormativeSource) {
  const text = buildCaseText(caseData);
  const haystack = normalize(
    [
      norm.normTitle,
      norm.article,
      norm.excerpt,
      ...(norm.themeTags || []),
      ...(norm.rightsTags || []),
      ...(norm.institutionTags || []),
      ...(norm.procedureTags || []),
      ...(norm.territorialTags || []),
      ...(norm.documentUseTags || []),
      norm.notes || ''
    ].join(' ')
  );

  let score = 0;
  const { themes, rights, institutions, procedures } = detectThemes(caseData);

  for (const theme of themes) {
    if (haystack.includes(normalize(theme))) score += 4;
  }

  for (const right of rights) {
    if (haystack.includes(normalize(right))) score += 4;
  }

  for (const inst of institutions) {
    if (haystack.includes(normalize(inst))) score += 3;
  }

  for (const proc of procedures) {
    if (haystack.includes(normalize(proc))) score += 3;
  }

  if (
    includesAny(text, ['cohana', 'katari', 'bahia', 'lago', 'tdps']) &&
    includesAny(haystack, ['alt', 'tdps', 'binacional'])
  ) {
    score += 8;
  }

  if (
    includesAny(text, ['informacion', 'información', 'sin respuesta', 'omision', 'omisión']) &&
    includesAny(haystack, ['escazu', 'informacion ambiental', 'peticion', 'control social'])
  ) {
    score += 8;
  }

  if (
    includesAny(text, ['amenaza', 'hostigamiento', 'represalia', 'defensora', 'lideresa', 'intimidacion']) &&
    includesAny(haystack, ['escazu', 'defensoria', 'proteccion', 'defensoras', 'hostigamiento'])
  ) {
    score += 9;
  }

  if (
    includesAny(text, ['consulta', 'participacion', 'participación', 'territorio']) &&
    includesAny(haystack, ['escazu', 'consulta', 'participacion', 'pueblos indigenas'])
  ) {
    score += 7;
  }

  if (
    includesAny(text, ['agua', 'contaminacion', 'aguas servidas', 'ptar']) &&
    includesAny(haystack, ['agua', 'contaminacion', 'alcantarillado', 'servicios de agua'])
  ) {
    score += 6;
  }

  if (
    includesAny(text, ['residuos', 'botadero', 'quema', 'microbasural', 'lixiviados']) &&
    includesAny(haystack, ['residuos', 'botadero', 'quema', 'lixiviados'])
  ) {
    score += 7;
  }

  if (
    includesAny(text, ['sustancias peligrosas', 'quimico', 'química', 'quimica', 'toxico', 'tóxico', 'derrame', 'combustible']) &&
    includesAny(haystack, ['sustancias peligrosas', 'riesgo quimico', 'toxico', 'derrame'])
  ) {
    score += 8;
  }

  if (isEscazuNorm(norm)) score += 2;
  if (isAltNorm(norm)) score += 2;
  if (isConstitutionalNorm(norm)) score += 1;
  if (isEnvironmentalRegulation(norm)) score += 1;

  if ((norm.validityStatus || '').toLowerCase() === 'verificada') {
    score += 1;
  }

  return score;
}

function pickBestByPredicate(
  ranked: Array<{ norm: NormativeSource; score: number }>,
  predicate: (norm: NormativeSource) => boolean
) {
  return ranked
    .filter((item) => predicate(item.norm))
    .sort((a, b) => b.score - a.score)[0]?.norm;
}

export function retrieveCandidateNorms(
  caseData: CaseRecord,
  normativeSeed: NormativeSource[]
): {
  analysis: CaseNormativeAnalysis;
  candidates: NormativeSource[];
} {
  const detected = detectThemes(caseData);
  const caseText = buildCaseText(caseData);

  const ranked = normativeSeed
    .map((norm) => ({
      norm,
      score: scoreNorm(caseData, norm)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const needsEscazu =
    includesAny(caseText, [
      'informacion',
      'información',
      'sin respuesta',
      'omision',
      'omisión',
      'consulta',
      'participacion',
      'participación',
      'amenaza',
      'hostigamiento',
      'defensora'
    ]) ||
    includesAny(
      normalize(detected.retrievalKeywords.join(' ')),
      ['escazu', 'informacion ambiental', 'participacion', 'defensoras']
    );

  const needsAlt =
    includesAny(caseText, ['cohana', 'katari', 'bahia', 'lago', 'tdps', 'binacional']) ||
    includesAny(normalize(detected.retrievalKeywords.join(' ')), ['alt', 'tdps', 'binacional']);

  const baseCandidates = ranked.slice(0, 8).map((item) => item.norm);

  const bestConstitutional = pickBestByPredicate(ranked, isConstitutionalNorm);
  const bestEnvironmentalRegulation = pickBestByPredicate(ranked, isEnvironmentalRegulation);
  const bestWaterSector = pickBestByPredicate(ranked, isWaterSectorNorm);
  const bestEscazu = needsEscazu ? pickBestByPredicate(ranked, isEscazuNorm) : undefined;
  const bestAlt = needsAlt ? pickBestByPredicate(ranked, isAltNorm) : undefined;
  const bestDefensoria = pickBestByPredicate(ranked, isDefensoriaNorm);

  const candidates = uniqueById([
    ...baseCandidates,
    ...(bestConstitutional ? [bestConstitutional] : []),
    ...(bestEnvironmentalRegulation ? [bestEnvironmentalRegulation] : []),
    ...(bestWaterSector ? [bestWaterSector] : []),
    ...(bestEscazu ? [bestEscazu] : []),
    ...(bestAlt ? [bestAlt] : []),
    ...(bestDefensoria ? [bestDefensoria] : [])
  ]).slice(0, 10);

  const summary =
    candidates.length > 0
      ? 'Se recuperaron normas candidatas con base en agua, ambiente, derechos, instituciones y procedimientos relacionados con el caso.'
      : 'No se recuperaron normas candidatas claras todavía.';

  const urgencyLevel: 'alta' | 'media' | 'baja' = includesAny(caseText, [
    'amenaza',
    'hostigamiento',
    'derrame',
    'mortandad',
    'aguas servidas'
  ])
    ? 'alta'
    : candidates.length > 0
      ? 'media'
      : 'baja';

  return {
    analysis: {
      summary,
      urgencyLevel,
      detectedThemes: detected.themes,
      possibleRights: detected.rights,
      possibleInstitutions: detected.institutions,
      possibleProcedures: detected.procedures,
      retrievalKeywords: detected.retrievalKeywords
    },
    candidates
  };
}

export function buildInitialNormativeMatches(
  caseData: CaseRecord,
  candidateNorms: NormativeSource[]
): CaseNormativeMatch[] {
  return candidateNorms.map((norm, index) => ({
    id: `${caseData.id}-norm-${index + 1}`,
    caseId: caseData.id,
    normativeSourceId: norm.id,
    relevance: 'media',
    functionInCase: 'fundamento inicial',
    rationale: 'Coincidencia preliminar entre el contenido del caso y los temas de la norma.',
    triggeringFact: caseData.problemType || caseData.title || 'Hechos del caso',
    missingForStrongerUse: 'Mayor precisión de hechos, autoridad competente y evidencia.',
    caution: 'Requiere validación contextual antes de uso más fuerte.',
    selectedForUse: false,
    selectedForDocuments: []
  }));
}