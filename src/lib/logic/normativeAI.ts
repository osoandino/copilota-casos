import type { CaseRecord } from '$lib/types/case';
import type {
  CaseNormativeAnalysis,
  NormativeSource
} from '$lib/types/normative';

export type NormativeAIEvaluation = {
  normativeSourceId: string;
  relevance: 'alta' | 'media' | 'baja';
  functionInCase: string;
  rationale: string;
  triggeringFact: string;
  missingForStrongerUse: string;
  caution: string;
};

function clean(text: unknown) {
  return String(text || '').trim();
}

function buildCaseContext(caseData: CaseRecord) {
  return [
    `Título: ${clean(caseData.title) || 'Sin título'}`,
    `Comunidad: ${clean(caseData.community) || 'No especificada'}`,
    `Lugar: ${clean(caseData.location) || 'No especificado'}`,
    `Tipo de problema: ${clean(caseData.problemType) || 'No especificado'}`,
    `Afectados: ${clean(caseData.affectedPeople) || 'No especificados'}`,
    `Estado: ${clean(caseData.status) || 'No especificado'}`,
    `Autoridad contactada: ${clean(caseData.authorityContacted) || 'No registrada'}`,
    `Respuesta institucional: ${clean(caseData.authorityResponse) || 'No registrada'}`,
    '',
    'Relato del caso:',
    clean(caseData.narrative) || 'Sin relato disponible.'
  ].join('\n');
}

function buildAnalysisContext(analysis: CaseNormativeAnalysis) {
  return [
    `Resumen analítico: ${clean(analysis.summary) || 'Sin resumen'}`,
    `Urgencia: ${clean(analysis.urgencyLevel) || 'No especificada'}`,
    `Temas detectados: ${(analysis.detectedThemes || []).join(', ') || 'Ninguno'}`,
    `Posibles derechos: ${(analysis.possibleRights || []).join(', ') || 'Ninguno'}`,
    `Posibles instituciones: ${(analysis.possibleInstitutions || []).join(', ') || 'Ninguna'}`,
    `Posibles procedimientos: ${(analysis.possibleProcedures || []).join(', ') || 'Ninguno'}`,
    `Palabras clave de recuperación: ${(analysis.retrievalKeywords || []).join(', ') || 'Ninguna'}`
  ].join('\n');
}

function buildNormsContext(candidateNorms: NormativeSource[]) {
  return candidateNorms
    .map((norm, index) => {
      return [
        `NORMA ${index + 1}`,
        `ID: ${norm.id}`,
        `Título: ${norm.normTitle}`,
        `Artículo: ${norm.article}`,
        `Tipo: ${norm.normType}`,
        `Jurisdicción: ${norm.jurisdictionLevel}`,
        `Estado de validez: ${norm.validityStatus}`,
        `Temas: ${(norm.themeTags || []).join(', ') || 'Ninguno'}`,
        `Derechos: ${(norm.rightsTags || []).join(', ') || 'Ninguno'}`,
        `Instituciones: ${(norm.institutionTags || []).join(', ') || 'Ninguna'}`,
        `Procedimientos: ${(norm.procedureTags || []).join(', ') || 'Ninguno'}`,
        `Uso documental sugerido: ${(norm.documentUseTags || []).join(', ') || 'Ninguno'}`,
        `Texto relevante: ${norm.excerpt}`,
        `Notas: ${norm.notes || 'Sin notas'}`
      ].join('\n');
    })
    .join('\n\n');
}

export function buildNormativeEvaluationPrompt(
  caseData: CaseRecord,
  analysis: CaseNormativeAnalysis,
  candidateNorms: NormativeSource[]
): string {
  return `
Eres una asistente experta en análisis jurídico-operativo para casos ambientales, hídricos, territoriales y de defensoras.

Tu tarea es valorar las normas candidatas y devolver un arreglo JSON estricto. No expliques nada fuera del JSON.

OBJETIVO
Para cada norma candidata, debes evaluar:
- qué tan relevante es para este caso;
- cuál es su función específica dentro del caso;
- qué hecho del caso activa esa norma;
- qué faltaría para usarla con más fuerza;
- qué cautela debe tenerse al usarla.

REGLAS GENERALES
1. No inventes hechos que no estén en el caso.
2. No inventes competencias institucionales que no se desprendan razonablemente de la norma o del caso.
3. Debes ser prudente: una norma puede ser relevante sin ser suficiente por sí sola.
4. Si una norma es general pero útil, puedes marcar relevancia media.
5. Si una norma encaja muy directamente con el problema, el derecho o la ruta institucional, marca relevancia alta.
6. Si una norma apenas tiene relación indirecta, marca relevancia baja.
7. Debes devolver una evaluación para TODAS las normas candidatas.
8. Devuelve SOLO un arreglo JSON válido.
9. No uses markdown.
10. No uses comentarios.
11. functionInCase debe ser una etiqueta corta y clara.

ETIQUETAS PERMITIDAS PARA functionInCase
Usa preferentemente una de estas:
- derecho_ambiental
- derecho_al_agua
- derecho_peticion
- acceso_informacion
- transparencia_activa
- participacion
- consulta
- control_social
- competencia_municipal
- competencia_ambiental
- competencia_binacional
- competencia_alt
- inspeccion_fiscalizacion
- seguimiento_omision
- gestion_riesgos
- salud_publica
- escalamiento_penal
- acceso_justicia_ambiental
- proteccion_defensoras
- fundamento_ecosistemico
- coordinacion_interinstitucional
- soporte_tecnico
- ruta_binacional
- otro

CRITERIOS ESPECIALES PARA ESCAZÚ
Si la norma es del Acuerdo de Escazú, distingue con cuidado:
- Art. 5: acceso_informacion
- Art. 6: transparencia_activa
- Art. 7: participacion
- Art. 8: acceso_justicia_ambiental o seguimiento_omision
- Art. 9: proteccion_defensoras

CRITERIOS ESPECIALES PARA ALT / TDPS
Si la norma se refiere a ALT, TDPS, binacionalidad o sistema hídrico compartido, prioriza:
- competencia_alt
- competencia_binacional
- ruta_binacional
- soporte_tecnico
- coordinacion_interinstitucional

CRITERIOS ESPECIALES PARA CPE / DERECHOS
Si la norma es constitucional y protege ambiente, agua, petición o participación, distingue:
- derecho_ambiental
- derecho_al_agua
- derecho_peticion
- participacion
- consulta

CRITERIOS ESPECIALES PARA LEY 341
Si la norma trata participación y control social, usa de preferencia:
- control_social
- acceso_informacion
- seguimiento_omision

FORMATO DE SALIDA
Debes devolver un arreglo JSON de objetos con esta forma exacta:
[
  {
    "normativeSourceId": "ID_DE_LA_NORMA",
    "relevance": "alta|media|baja",
    "functionInCase": "etiqueta_corta",
    "rationale": "explicación breve y concreta",
    "triggeringFact": "hecho del caso que activa la norma",
    "missingForStrongerUse": "qué faltaría para usarla con más fuerza",
    "caution": "cautela breve"
  }
]

CASO
${buildCaseContext(caseData)}

ANÁLISIS PREVIO
${buildAnalysisContext(analysis)}

NORMAS CANDIDATAS
${buildNormsContext(candidateNorms)}
`.trim();
}