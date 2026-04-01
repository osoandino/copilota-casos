import type { CaseRecord } from '$lib/types/case';

export type InstitutionRecommendation = {
  primary: string;
  secondary: string;
  confidence: 'alta' | 'media' | 'baja';
  reason: string;
  nextStep: string;
};

export type PreliminaryReading = {
  dossierState: string;
  findings: string[];
  criticalGaps: string[];
  legalOperationalSuggestion: string;
};

export type SuggestedDocument = {
  name: string;
  why: string;
};

function norm(text: string) {
  return (text || '').toLowerCase();
}

function textBlob(caseData: CaseRecord) {
  return [
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
    .join(' ')
    .toLowerCase();
}

export function recommendInstitution(caseData: CaseRecord): InstitutionRecommendation {
  const t = textBlob(caseData);

  if (t.includes('cohana') || t.includes('katari') || t.includes('lago')) {
    return {
      primary: 'ALT',
      secondary: 'Municipio',
      confidence: 'alta',
      reason: 'El caso parece referirse a una fuente o cuerpo de agua que puede requerir actuación de autoridad hídrica especializada.',
      nextStep: 'Preparar ficha del caso y solicitud de inspección o atención técnica.'
    };
  }

  if (t.includes('amenaza') || t.includes('hostigamiento') || t.includes('represalia')) {
    return {
      primary: 'Defensoría del Pueblo',
      secondary: 'Fiscalía',
      confidence: 'alta',
      reason: 'El caso presenta posibles riesgos o represalias contra personas defensoras.',
      nextStep: 'Registrar el incidente y preparar presentación a Defensoría y/o denuncia.'
    };
  }

  if (t.includes('residuo') || t.includes('botadero') || t.includes('quema') || t.includes('basura')) {
    return {
      primary: 'Municipio',
      secondary: 'Defensoría del Pueblo',
      confidence: 'media',
      reason: 'La gestión inmediata parece recaer en la autoridad municipal o de aseo/medio ambiente.',
      nextStep: 'Presentar solicitud de inspección y solicitud de información.'
    };
  }

  return {
    primary: 'Municipio',
    secondary: 'Defensoría del Pueblo',
    confidence: 'media',
    reason: 'La autoridad local suele ser la primera ventanilla para inspección, verificación o gestión inicial.',
    nextStep: 'Preparar una presentación inicial con evidencia y solicitud concreta.'
  };
}

export function getPreliminaryReading(caseData: CaseRecord): PreliminaryReading {
  const findings: string[] = [];
  const criticalGaps: string[] = [];

  if (!caseData.narrative) criticalGaps.push('Falta relato del caso.');
  if (!caseData.location) criticalGaps.push('Falta ubicación del caso.');
  if (!caseData.problemType) criticalGaps.push('Falta tipo de problema.');
  if ((caseData.evidence || []).length === 0) criticalGaps.push('No hay evidencia registrada.');

  if (caseData.narrative) findings.push('Caso en construcción con elementos aún generales.');
  if ((caseData.evidence || []).length > 0) findings.push('Existe al menos evidencia inicial registrada.');

  return {
    dossierState:
      criticalGaps.length > 2
        ? 'incompleto'
        : criticalGaps.length > 0
          ? 'parcialmente completo'
          : 'suficiente para presentación inicial',
    findings,
    criticalGaps,
    legalOperationalSuggestion:
      criticalGaps.length > 0
        ? 'Conviene completar primero los vacíos del expediente antes de escalar.'
        : 'Preparar una solicitud inicial de inspección o atención dirigida a la autoridad competente.'
  };
}

export function recommendDocuments(caseData: CaseRecord): SuggestedDocument[] {
  const t = textBlob(caseData);
  const docs: SuggestedDocument[] = [];

  docs.push({
    name: 'Solicitud de inspección',
    why: 'Sirve para pedir verificación técnica, constatación en sitio y respuesta formal.'
  });

  docs.push({
    name: 'Solicitud de información',
    why: 'Sirve para pedir antecedentes, informes, medidas, monitoreos o aclaraciones.'
  });

  if (caseData.authorityContacted || caseData.authorityResponse) {
    docs.push({
      name: 'Nota de seguimiento',
      why: 'Permite reiterar, documentar omisión o pedir actualización de acciones.'
    });
  }

  if (t.includes('cohana') || t.includes('katari') || t.includes('lago') || t.includes('tdps')) {
    docs.push({
      name: 'Presentación a la ALT',
      why: 'Es pertinente cuando el caso tiene dimensión hídrica, lacustre o sistémica.'
    });
  }

  if (
    t.includes('amenaza') ||
    t.includes('hostigamiento') ||
    t.includes('represalia') ||
    t.includes('sin respuesta') ||
    t.includes('no respondio') ||
    t.includes('no respondió')
  ) {
    docs.push({
      name: 'Presentación a Defensoría del Pueblo',
      why: 'Sirve para solicitar intervención, seguimiento o tutela frente a afectación de derechos u omisión institucional.'
    });
  }

  if (t.includes('comunidad') || t.includes('territorio') || t.includes('consulta')) {
    docs.push({
      name: 'Acta breve comunitaria',
      why: 'Permite registrar acuerdos, mandato y validación comunitaria del caso.'
    });
  }

  return docs;
}