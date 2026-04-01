import type { CaseRecord } from '$lib/types/case';
import type { ActionPattern, OperationalCaseAnalysis } from '$lib/types/operational';

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

function unique<T>(arr: T[]) {
  return [...new Set(arr)];
}

function deriveKeywords(caseData: CaseRecord) {
  const text = [
    caseData.title,
    caseData.narrative,
    caseData.problemType,
    caseData.community,
    caseData.location,
    caseData.affectedPeople,
    caseData.authorityContacted,
    caseData.authorityResponse
  ]
    .filter(Boolean)
    .join(' ');

  const t = normalize(text);
  const tags: string[] = [];

  if (includesAny(t, ['agua', 'lago', 'bahia', 'cohana', 'katari', 'ribera'])) tags.push('agua');
  if (includesAny(t, ['contaminacion', 'aguas servidas', 'residual', 'descarga', 'espuma', 'olor', 'algas'])) tags.push('contaminacion_hidrica');
  if (includesAny(t, ['ptar', 'alcantarillado', 'rebalse', 'saneamiento'])) tags.push('ptar');
  if (includesAny(t, ['basura', 'residuo', 'botadero', 'quema', 'microbasural', 'plastico'])) tags.push('residuos');
  if (includesAny(t, ['inundacion', 'desborde', 'riada', 'lluvia', 'cultivos', 'viviendas'])) tags.push('inundacion');
  if (includesAny(t, ['derrame', 'combustible', 'aceite', 'hidrocarburo', 'mancha'])) tags.push('derrame');
  if (includesAny(t, ['consulta', 'socializacion', 'proyecto', 'concesion', 'territorio'])) tags.push('consulta');
  if (includesAny(t, ['amenaza', 'hostigamiento', 'represalia', 'difamacion', 'vigilancia'])) tags.push('defensoras');

  return unique(tags);
}

function scorePattern(caseData: CaseRecord, pattern: ActionPattern): { score: number; matchedSignals: string[] } {
  const text = [
    caseData.title,
    caseData.narrative,
    caseData.problemType,
    caseData.community,
    caseData.location,
    caseData.affectedPeople,
    caseData.authorityContacted,
    caseData.authorityResponse
  ]
    .filter(Boolean)
    .join(' ');

  const t = normalize(text);
  const matchedSignals = pattern.signals.filter((signal) => t.includes(normalize(signal)));

  let score = matchedSignals.length * 2;
  const tags = deriveKeywords(caseData);
  const p = normalize(`${pattern.label} ${pattern.shortDescription}`);

  if (tags.includes('agua') && includesAny(p, ['agua', 'lago', 'bahia', 'cohana', 'ribera'])) score += 3;
  if (tags.includes('contaminacion_hidrica') && includesAny(p, ['contaminacion', 'aguas residuales', 'ptar', 'cohana'])) score += 5;
  if (tags.includes('ptar') && includesAny(p, ['ptar', 'aguas residuales', 'rebalses'])) score += 6;
  if (tags.includes('residuos') && includesAny(p, ['residuos', 'botaderos', 'quema', 'microbasurales'])) score += 6;
  if (tags.includes('inundacion') && includesAny(p, ['inundaciones', 'desbordes'])) score += 6;
  if (tags.includes('derrame') && includesAny(p, ['derrame', 'combustible', 'aceites'])) score += 6;
  if (tags.includes('consulta') && includesAny(p, ['consulta previa', 'participacion'])) score += 6;
  if (tags.includes('defensoras') && includesAny(p, ['defensoras', 'hostigamiento', 'amenazas'])) score += 6;

  if (
    includesAny(t, ['cohana', 'katari', 'bahia de cohana', 'lago menor']) &&
    includesAny(p, ['cohana', 'katari', 'lago menor'])
  ) {
    score += 8;
  }

  if (
    includesAny(t, ['aguas servidas', 'descargas', 'descarga', 'alcantarillado']) &&
    includesAny(p, ['aguas residuales', 'ptar'])
  ) {
    score += 7;
  }

  return { score, matchedSignals };
}

export function analyzeOperationalRoutes(
  caseData: CaseRecord,
  patterns: ActionPattern[]
): {
  analysis: OperationalCaseAnalysis;
  candidates: ActionPattern[];
  primaryCandidate: ActionPattern | null;
  secondaryCandidates: ActionPattern[];
} {
  const ranked = patterns
    .map((pattern) => {
      const { score, matchedSignals } = scorePattern(caseData, pattern);
      return { pattern, score, matchedSignals };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const topScore = ranked.length > 0 ? ranked[0].score : 0;

  const filtered = ranked.filter(
    (item) => item.score >= Math.max(6, topScore - 3)
  );

  const candidates = filtered.slice(0, 3).map((item) => item.pattern);
  const primaryCandidate = candidates.length > 0 ? candidates[0] : null;
  const secondaryCandidates = candidates.slice(1);

  const matchedSignals = unique(filtered.flatMap((item) => item.matchedSignals));
  const likelyAuthorities = unique(candidates.flatMap((p) => p.typicalAuthorities));
  const recommendedTemplates = unique(candidates.flatMap((p) => p.templateKeys));
  const primaryActions = unique(candidates.flatMap((p) => p.primaryRoute));
  const escalationActions = unique(candidates.flatMap((p) => p.escalationRoute));

  const expectedEvidence = unique(
    candidates.flatMap((p) => p.minimumEvidence.map((e) => e.label))
  );

  const caseBlob = normalize(
    JSON.stringify({
      evidence: caseData.evidence || [],
      narrative: caseData.narrative || '',
      title: caseData.title || ''
    })
  );

  const missingEvidence = expectedEvidence.filter(
    (item) => !caseBlob.includes(normalize(item).slice(0, 10))
  );

  let urgency: 'alta' | 'media' | 'baja' = 'baja';
  if (candidates.some((p) => p.urgency === 'alta')) urgency = 'alta';
  else if (candidates.some((p) => p.urgency === 'media')) urgency = 'media';

  const summary =
    candidates.length > 0
      ? `Se identifican patrones operativos probables: ${candidates.map((c) => c.label).join('; ')}.`
      : 'No se identificó todavía un patrón operativo claro.';

  return {
    analysis: {
      caseId: caseData.id,
      probableActionPatternIds: candidates.map((c) => c.id),
      detectedSignals: matchedSignals,
      missingEvidence,
      likelyAuthorities,
      recommendedTemplates,
      primaryActions,
      escalationActions,
      urgency,
      summary
    },
    candidates,
    primaryCandidate,
    secondaryCandidates
  };
}