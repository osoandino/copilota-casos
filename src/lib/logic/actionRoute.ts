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

const ALT_FORMAL_NAME = 'Autoridad Binacional Autónoma del Sistema Hídrico TDPS (ALT)';
const ALT_SHORT_NAME = 'ALT – Autoridad Binacional Autónoma del Sistema Hídrico TDPS';

export function recommendInstitution(caseData: CaseRecord): InstitutionRecommendation {
  const t = textBlob(caseData);

  if (t.includes('cohana') || t.includes('katari') || t.includes('lago') || t.includes('tdps') || t.includes('titicaca')) {
    return {
      primary: ALT_FORMAL_NAME,
      secondary: 'Gobierno Autónomo Municipal competente',
      confidence: 'alta',
      reason:
        'El caso parece referirse a una afectación hídrica o lacustre con posible dimensión sistémica o binacional, por lo que puede corresponder una ventanilla especializada del sistema TDPS, además de la actuación municipal.',
      nextStep:
        'Preparar ficha del caso, paquete de evidencia y presentación a la ALT, además de registrar con precisión las gestiones realizadas.'
    };
  }

  if (
    t.includes('amenaza') ||
    t.includes('hostigamiento') ||
    t.includes('represalia') ||
    t.includes('lideresa') ||
    t.includes('defensora')
  ) {
    return {
      primary: 'Defensoría del Pueblo',
      secondary: 'Fiscalía',
      confidence: 'alta',
      reason:
        'El caso presenta posibles riesgos, represalias o afectación a personas defensoras o lideresas.',
      nextStep:
        'Registrar el incidente, consolidar evidencia y preparar presentación a Defensoría y/o denuncia según corresponda.'
    };
  }

  if (
    t.includes('residuo') ||
    t.includes('botadero') ||
    t.includes('quema') ||
    t.includes('basura') ||
    t.includes('ptar') ||
    t.includes('alcantarillado') ||
    t.includes('aguas residuales') ||
    t.includes('descarga')
  ) {
    return {
      primary: 'Gobierno Autónomo Municipal competente',
      secondary: 'Defensoría del Pueblo',
      confidence: 'alta',
      reason:
        'La gestión inmediata parece recaer en la autoridad municipal o en la unidad competente de medio ambiente, saneamiento o servicios básicos.',
      nextStep:
        'Presentar solicitud de inspección, memorial al municipio y solicitud de información, con evidencia organizada.'
    };
  }

  return {
    primary: 'Gobierno Autónomo Municipal competente',
    secondary: 'Defensoría del Pueblo',
    confidence: 'media',
    reason:
      'La autoridad local suele ser la primera ventanilla para inspección, verificación o gestión inicial.',
    nextStep:
      'Preparar ficha resumen, memorial inicial con evidencia y una solicitud concreta.'
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
  if ((caseData.events || []).length > 0) findings.push('Existe trazabilidad básica de actuaciones o eventos del caso.');

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
        : 'El caso ya permite generar documentos iniciales, organizar evidencia y activar la ruta institucional correspondiente.'
  };
}

export function recommendDocuments(caseData: CaseRecord): SuggestedDocument[] {
  const t = textBlob(caseData);
  const docs: SuggestedDocument[] = [];

  docs.push({
    name: 'Ficha resumen del caso',
    why: 'Sirve como documento base del expediente y resume hechos, actores, evidencia y seguimiento.'
  });

  docs.push({
    name: 'Solicitud de inspección',
    why: 'Sirve para pedir verificación técnica, constatación en sitio y respuesta formal.'
  });

  docs.push({
    name: 'Solicitud de información',
    why: 'Sirve para pedir antecedentes, informes, medidas, monitoreos o aclaraciones.'
  });

  if ((caseData.evidence || []).length > 0) {
    docs.push({
      name: 'Paquete de evidencia',
      why: 'Permite organizar la evidencia comunitaria con referencias, metadatos y soporte para presentación institucional.'
    });
  }

  if (caseData.authorityContacted || caseData.authorityResponse) {
    docs.push({
      name: 'Nota de seguimiento',
      why: 'Permite reiterar, documentar omisión o pedir actualización de acciones.'
    });
  }

  if ((caseData.events || []).length > 0) {
    docs.push({
      name: 'Cronología del caso',
      why: 'Ayuda a ordenar actuaciones, hechos y eventos registrados en el tiempo.'
    });
  }

  if (
    t.includes('cohana') ||
    t.includes('katari') ||
    t.includes('lago') ||
    t.includes('tdps') ||
    t.includes('titicaca')
  ) {
    docs.push({
      name: 'Presentación a la ALT',
      why: 'Es pertinente cuando el caso tiene dimensión hídrica, lacustre o sistémica vinculada al sistema TDPS.'
    });

    docs.push({
      name: 'Paquete de evidencia',
      why: 'Refuerza la presentación ante la ALT con evidencia organizada y trazable.'
    });
  }

  if (
    t.includes('residuo') ||
    t.includes('botadero') ||
    t.includes('quema') ||
    t.includes('basura') ||
    t.includes('ptar') ||
    t.includes('alcantarillado') ||
    t.includes('aguas residuales') ||
    t.includes('descarga')
  ) {
    docs.push({
      name: 'Memorial al municipio',
      why: 'Permite activar formalmente la ruta municipal con un petitorio más completo que una simple solicitud.'
    });
  }

  if (
    t.includes('amenaza') ||
    t.includes('hostigamiento') ||
    t.includes('represalia') ||
    t.includes('sin respuesta') ||
    t.includes('no respondio') ||
    t.includes('no respondió') ||
    t.includes('lideresa') ||
    t.includes('defensora')
  ) {
    docs.push({
      name: 'Presentación a Defensoría del Pueblo',
      why: 'Sirve para solicitar intervención, seguimiento o tutela frente a afectación de derechos u omisión institucional.'
    });
  }

  if (
    t.includes('comunidad') ||
    t.includes('territorio') ||
    t.includes('consulta') ||
    t.includes('asamblea') ||
    t.includes('acuerdo')
  ) {
    docs.push({
      name: 'Acta breve comunitaria',
      why: 'Permite registrar acuerdos, mandato y validación comunitaria del caso.'
    });

    docs.push({
      name: 'Minuta de reunión',
      why: 'Ayuda a sistematizar reuniones de coordinación, revisión del caso y próximos pasos.'
    });
  }

  const seen = new Set<string>();
  return docs.filter((doc) => {
    if (seen.has(doc.name)) return false;
    seen.add(doc.name);
    return true;
  });
}

export { ALT_FORMAL_NAME, ALT_SHORT_NAME };