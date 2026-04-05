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

function uniqueStrings(items: string[]) {
  return [...new Set(items.filter(Boolean).map((x) => normalize(x)))];
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

  if (includesAny(text, ['agua', 'lago', 'bahia', 'cohana', 'katari', 'tdps', 'titicaca'])) {
    themes.push('agua', 'contaminacion hidrica');
    rights.push('agua', 'medio ambiente');
    institutions.push('municipio', 'autoridad ambiental', 'alt');
    retrievalKeywords.push('agua', 'contaminacion', 'alt', 'tdps', 'binacional', 'titicaca');
  }

  if (includesAny(text, ['aguas servidas', 'descarga', 'descargas', 'ptar', 'alcantarillado', 'rebalse'])) {
    themes.push('aguas residuales', 'saneamiento');
    rights.push('salud', 'agua');
    institutions.push('municipio', 'epsa', 'autoridad ambiental');
    procedures.push('inspeccion', 'fiscalizacion');
    retrievalKeywords.push('aguas residuales', 'ptar', 'alcantarillado', 'saneamiento');
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
    retrievalKeywords.push('residuos', 'botadero', 'quema', 'microbasurales', 'lixiviados');
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
    retrievalKeywords.push('sustancias peligrosas', 'riesgo quimico', 'derrame', 'toxico');
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
      'acoso',
      'violencia',
      'violencia politica',
      'acoso politico'
    ])
  ) {
    themes.push('defensoras', 'proteccion');
    rights.push('proteccion', 'participacion', 'integridad', 'seguridad', 'no violencia');
    institutions.push('defensoria', 'fiscalia', 'policia');
    procedures.push('proteccion', 'seguimiento', 'acompanamiento', 'denuncia');
    retrievalKeywords.push(
      'defensoras',
      'escazu',
      'proteccion',
      'defensoria',
      'hostigamiento',
      'ley 243',
      'ley 348'
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
      'no fueron informados',
      'sin informe',
      'sin informacion'
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
      'antecedentes',
      'expediente'
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
      'consulta previa',
      'fpic',
      'consentimiento libre previo e informado',
      'territorio',
      'territorial',
      'pueblos indigenas',
      'pueblos indígenas',
      'indigena',
      'indígena',
      'comunidad indigena',
      'comunidad indígena',
      'aymara',
      'quechua',
      'recurso natural',
      'recursos naturales'
    ])
  ) {
    themes.push('participacion', 'territorio', 'consulta previa', 'pueblos indigenas');
    rights.push('participacion', 'consulta', 'territorio', 'derechos colectivos');
    institutions.push('defensoria', 'estado', 'autoridad ambiental');
    procedures.push('consulta', 'acta comunitaria', 'seguimiento');
    retrievalKeywords.push(
      'participacion',
      'consulta',
      'escazu',
      'territorio',
      'oit 169',
      'undrip',
      'fpic'
    );
  }

  if (
    includesAny(text, [
      'control social',
      'rendicion de cuentas',
      'rendición de cuentas',
      'fiscalizacion social',
      'fiscalización social'
    ])
  ) {
    themes.push('control social');
    rights.push('participacion', 'acceso a informacion', 'control social');
    institutions.push('municipio', 'entidad publica', 'defensoria');
    procedures.push('seguimiento', 'rendicion de cuentas', 'solicitud de informacion');
    retrievalKeywords.push('control social', 'ley 341', 'seguimiento', 'rendicion de cuentas');
  }

  return {
    themes: uniqueStrings(themes),
    rights: uniqueStrings(rights),
    institutions: uniqueStrings(institutions),
    procedures: uniqueStrings(procedures),
    retrievalKeywords: uniqueStrings(retrievalKeywords)
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
  return includesAny(haystack, ['alt', 'tdps', 'binacional', 'sistema hidrico', 'titicaca']);
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

function isIndigenousRightsNorm(norm: NormativeSource) {
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
    'pueblos indigenas',
    'consulta previa',
    'territorio',
    'oit 169',
    'undrip',
    'consentimiento',
    'fpic'
  ]);
}

function isProtectionNorm(norm: NormativeSource) {
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
    'proteccion',
    'defensoras',
    'hostigamiento',
    'amenazas',
    'violencia',
    'ley 243',
    'ley 348',
    'belem'
  ]);
}

function documentUseBoost(text: string, norm: NormativeSource) {
  const tags = (norm.documentUseTags || []).map((x) => normalize(x));
  let bonus = 0;

  if (
    includesAny(text, ['alt', 'cohana', 'katari', 'lago', 'tdps', 'binacional']) &&
    tags.includes('presentacion_alt')
  ) {
    bonus += 5;
  }

  if (
    includesAny(text, ['defensora', 'lideresa', 'amenaza', 'hostigamiento', 'omision', 'omisión']) &&
    tags.includes('presentacion_defensoria')
  ) {
    bonus += 5;
  }

  if (
    includesAny(text, ['inspeccion', 'descarga', 'ptar', 'botadero', 'quema', 'derrame']) &&
    tags.includes('solicitud_inspeccion')
  ) {
    bonus += 4;
  }

  if (
    includesAny(text, ['informacion', 'información', 'respuesta', 'informe', 'monitoreo', 'antecedentes']) &&
    tags.includes('solicitud_informacion')
  ) {
    bonus += 4;
  }

  if (
    includesAny(text, ['comunidad', 'consulta', 'territorio', 'acuerdo', 'asamblea']) &&
    tags.includes('acta_comunitaria')
  ) {
    bonus += 3;
  }

  if (
    includesAny(text, ['seguimiento', 'sin respuesta', 'omision', 'omisión']) &&
    tags.includes('nota_seguimiento')
  ) {
    bonus += 3;
  }

  return bonus;
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
    includesAny(text, ['cohana', 'katari', 'bahia', 'lago', 'tdps', 'titicaca']) &&
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
    includesAny(text, ['amenaza', 'hostigamiento', 'represalia', 'defensora', 'lideresa', 'intimidacion', 'acoso']) &&
    includesAny(haystack, ['escazu', 'defensoria', 'proteccion', 'defensoras', 'hostigamiento', 'ley 243', 'ley 348'])
  ) {
    score += 10;
  }

  if (
    includesAny(text, ['consulta', 'consulta previa', 'territorio', 'fpic', 'pueblos indigenas', 'aymara', 'quechua']) &&
    includesAny(haystack, ['escazu', 'consulta', 'participacion', 'pueblos indigenas', 'oit 169', 'undrip', 'territorio'])
  ) {
    score += 10;
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

  score += documentUseBoost(text, norm);

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
      'defensora',
      'lideresa'
    ]) ||
    includesAny(
      normalize(detected.retrievalKeywords.join(' ')),
      ['escazu', 'informacion ambiental', 'participacion', 'defensoras']
    );

  const needsAlt =
    includesAny(caseText, ['cohana', 'katari', 'bahia', 'lago', 'tdps', 'binacional', 'titicaca']) ||
    includesAny(normalize(detected.retrievalKeywords.join(' ')), ['alt', 'tdps', 'binacional']);

  const needsIndigenous =
    includesAny(caseText, [
      'consulta',
      'consulta previa',
      'fpic',
      'territorio',
      'pueblos indigenas',
      'pueblos indígenas',
      'aymara',
      'quechua'
    ]) ||
    includesAny(normalize(detected.retrievalKeywords.join(' ')), ['oit 169', 'undrip', 'fpic', 'territorio']);

  const needsProtection =
    includesAny(caseText, [
      'amenaza',
      'hostigamiento',
      'represalia',
      'defensora',
      'lideresa',
      'acoso',
      'violencia'
    ]) ||
    includesAny(normalize(detected.retrievalKeywords.join(' ')), ['ley 243', 'ley 348', 'proteccion', 'defensoras']);

  const baseCandidates = ranked.slice(0, 10).map((item) => item.norm);

  const bestConstitutional = pickBestByPredicate(ranked, isConstitutionalNorm);
  const bestEnvironmentalRegulation = pickBestByPredicate(ranked, isEnvironmentalRegulation);
  const bestWaterSector = pickBestByPredicate(ranked, isWaterSectorNorm);
  const bestEscazu = needsEscazu ? pickBestByPredicate(ranked, isEscazuNorm) : undefined;
  const bestAlt = needsAlt ? pickBestByPredicate(ranked, isAltNorm) : undefined;
  const bestDefensoria = pickBestByPredicate(ranked, isDefensoriaNorm);
  const bestIndigenous = needsIndigenous ? pickBestByPredicate(ranked, isIndigenousRightsNorm) : undefined;
  const bestProtection = needsProtection ? pickBestByPredicate(ranked, isProtectionNorm) : undefined;

  const candidates = uniqueById([
    ...baseCandidates,
    ...(bestConstitutional ? [bestConstitutional] : []),
    ...(bestEnvironmentalRegulation ? [bestEnvironmentalRegulation] : []),
    ...(bestWaterSector ? [bestWaterSector] : []),
    ...(bestEscazu ? [bestEscazu] : []),
    ...(bestAlt ? [bestAlt] : []),
    ...(bestDefensoria ? [bestDefensoria] : []),
    ...(bestIndigenous ? [bestIndigenous] : []),
    ...(bestProtection ? [bestProtection] : [])
  ]).slice(0, 12);

  const summary =
    candidates.length > 0
      ? 'Se recuperaron normas candidatas con base en agua, ambiente, derechos, participación, instituciones y procedimientos relacionados con el caso.'
      : 'No se recuperaron normas candidatas claras todavía.';

  const urgencyLevel: 'alta' | 'media' | 'baja' = includesAny(caseText, [
    'amenaza',
    'hostigamiento',
    'derrame',
    'mortandad',
    'aguas servidas',
    'violencia'
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

function inferInitialRelevance(caseData: CaseRecord, norm: NormativeSource): 'alta' | 'media' | 'baja' {
  const score = scoreNorm(caseData, norm);
  if (score >= 20) return 'alta';
  if (score >= 10) return 'media';
  return 'baja';
}

function inferFunctionInCase(norm: NormativeSource): string {
  const haystack = normalize(
    [
      norm.normTitle,
      norm.article,
      ...(norm.themeTags || []),
      ...(norm.procedureTags || []),
      ...(norm.documentUseTags || [])
    ].join(' ')
  );

  if (includesAny(haystack, ['solicitud de informacion', 'informacion ambiental', 'peticion'])) {
    return 'base para solicitar información y exigir respuesta institucional';
  }

  if (includesAny(haystack, ['inspeccion', 'fiscalizacion', 'control ambiental'])) {
    return 'base para solicitar inspección, fiscalización o verificación técnica';
  }

  if (includesAny(haystack, ['defensoria', 'proteccion', 'defensoras', 'hostigamiento'])) {
    return 'base para escalamiento protector o defensorial';
  }

  if (includesAny(haystack, ['consulta', 'territorio', 'oit 169', 'undrip', 'fpic'])) {
    return 'base para participación, consulta o defensa territorial';
  }

  if (includesAny(haystack, ['alt', 'tdps', 'binacional'])) {
    return 'base para presentación ante ALT o articulación binacional';
  }

  return 'fundamento inicial';
}

function inferMissingForStrongerUse(caseData: CaseRecord): string {
  const missing: string[] = [];

  if (!caseData.location) missing.push('ubicación precisa');
  if (!caseData.problemType) missing.push('tipo de problema');
  if (!caseData.narrative) missing.push('relato claro de los hechos');
  if (!caseData.authorityContacted) missing.push('registro de gestiones previas');
  if (!caseData.evidence || caseData.evidence.length === 0) missing.push('evidencia básica');

  return missing.length > 0
    ? `Conviene reforzar: ${missing.join(', ')}.`
    : 'Conviene precisar mejor autoridad competente, fechas y anexos probatorios.';
}

function inferCaution(norm: NormativeSource): string {
  const haystack = normalize(
    [norm.normTitle, norm.article, ...(norm.themeTags || []), norm.notes || ''].join(' ')
  );

  if (includesAny(haystack, ['consulta', 'oit 169', 'undrip', 'fpic'])) {
    return 'Debe usarse con validación contextual sobre afectación directa, procedimiento aplicable y representación comunitaria.';
  }

  if (includesAny(haystack, ['penal', 'fiscalia', 'salud publica'])) {
    return 'Puede requerir evidencia más sólida y evaluación jurídica antes de escalar a vía penal.';
  }

  if (includesAny(haystack, ['alt', 'tdps', 'binacional'])) {
    return 'Conviene diferenciar claramente cuándo corresponde ventanilla ALT y cuándo corresponde municipio, autoridad ambiental o EPSA.';
  }

  return 'Requiere validación contextual antes de uso más fuerte.';
}

export function buildInitialNormativeMatches(
  caseData: CaseRecord,
  candidateNorms: NormativeSource[]
): CaseNormativeMatch[] {
  return candidateNorms.map((norm, index) => ({
    id: `${caseData.id}-norm-${index + 1}`,
    caseId: caseData.id,
    normativeSourceId: norm.id,
    relevance: inferInitialRelevance(caseData, norm),
    functionInCase: inferFunctionInCase(norm),
    rationale: 'Coincidencia preliminar entre el contenido del caso, los derechos involucrados y la función potencial de esta norma.',
    triggeringFact: caseData.problemType || caseData.title || 'Hechos del caso',
    missingForStrongerUse: inferMissingForStrongerUse(caseData),
    caution: inferCaution(norm),
    selectedForUse: false,
    selectedForDocuments: []
  }));
}