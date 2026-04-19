import type { DocumentUseKey } from '$lib/types/normative';

export type DocumentCategory =
  | 'sintesis'
  | 'peticion'
  | 'seguimiento'
  | 'incidencia'
  | 'registro'
  | 'evidencia';

export type DocumentRegistryItem = {
  key: DocumentUseKey;
  name: string;
  shortName: string;
  category: DocumentCategory;
  purpose: string;
  defaultTone: string;
  typicalAudience: string;
  requiresNormativeSupport: boolean;
  priorityFunctions: string[];
  keywords: string[];
  specificInstruction: string;
};

export const documentRegistry: DocumentRegistryItem[] = [
  {
    key: 'ficha_resumen',
    name: 'Ficha resumen del caso',
    shortName: 'Ficha resumen',
    category: 'sintesis',
    purpose:
      'Sintetizar el caso de forma clara, ordenada y útil para revisión, seguimiento o derivación.',
    defaultTone: 'claro e institucional',
    typicalAudience: 'equipo técnico, lideresas, paralegales o autoridades de referencia',
    requiresNormativeSupport: false,
    priorityFunctions: [
      'derecho_ambiental',
      'derecho_al_agua',
      'participacion',
      'control_social'
    ],
    keywords: ['ficha', 'resumen', 'síntesis', 'sintesis', 'caso'],
    specificInstruction: `
TIPO DOCUMENTAL: FICHA RESUMEN

FINALIDAD
Este documento debe sintetizar el caso de forma clara, ordenada y útil para revisión, seguimiento o derivación.

INSTRUCCIONES ESPECÍFICAS
- Resume hechos, lugar, personas afectadas, actuaciones previas y estado actual.
- Mantén tono claro, sobrio y organizativo.
- Ordena el contenido en secciones breves y útiles.
- No conviertas la ficha en denuncia agresiva ni en ensayo jurídico largo.
- Usa la base normativa solo para orientar o contextualizar, no para sobrecargar la ficha.
`.trim()
  },
  {
    key: 'solicitud_inspeccion',
    name: 'Solicitud de inspección',
    shortName: 'Inspección',
    category: 'peticion',
    purpose:
      'Solicitar actuación concreta e inmediata de verificación técnica en sitio.',
    defaultTone: 'formal y operativo',
    typicalAudience: 'municipio, unidad ambiental, autoridad técnica o instancia fiscalizadora',
    requiresNormativeSupport: true,
    priorityFunctions: [
      'inspeccion_fiscalizacion',
      'competencia_municipal',
      'competencia_ambiental',
      'gestion_riesgos',
      'salud_publica',
      'derecho_ambiental',
      'derecho_al_agua'
    ],
    keywords: ['inspección', 'inspeccion', 'verificación', 'verificacion', 'fiscalización'],
    specificInstruction: `
TIPO DOCUMENTAL: SOLICITUD DE INSPECCIÓN

FINALIDAD
Este documento debe pedir actuación concreta e inmediata de verificación técnica en sitio.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono formal, operativo y preciso.
- Mantén foco en hechos verificables, lugar, afectación observada y evidencia disponible.
- El petitorio debe incluir inspección en sitio, verificación técnica y, si corresponde, constatación de descargas, rebalses, residuos, afectación hídrica o toma de muestras.
- Da prioridad a normas cuya función sea inspeccion_fiscalizacion, competencia_municipal, competencia_ambiental, gestion_riesgos o salud_publica.
- No conviertas el documento en una denuncia penal ni en una carta política.
`.trim()
  },
  {
    key: 'solicitud_informacion',
    name: 'Solicitud de información',
    shortName: 'Información',
    category: 'peticion',
    purpose:
      'Pedir información concreta, identificable y útil para abrir, fortalecer o aclarar el expediente.',
    defaultTone: 'formal y administrativo',
    typicalAudience: 'autoridad competente o entidad pública obligada a responder',
    requiresNormativeSupport: true,
    priorityFunctions: [
      'acceso_informacion',
      'transparencia_activa',
      'derecho_peticion',
      'seguimiento_omision',
      'control_social'
    ],
    keywords: ['información', 'informacion', 'datos', 'respuesta', 'petición', 'peticion'],
    specificInstruction: `
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
`.trim()
  },
  {
    key: 'nota_seguimiento',
    name: 'Nota de seguimiento',
    shortName: 'Seguimiento',
    category: 'seguimiento',
    purpose:
      'Dejar constancia de actuaciones previas y pedir respuesta, avance o cumplimiento.',
    defaultTone: 'formal y sobrio',
    typicalAudience: 'autoridad o institución ya contactada previamente',
    requiresNormativeSupport: true,
    priorityFunctions: [
      'seguimiento_omision',
      'derecho_peticion',
      'control_social',
      'transparencia_activa'
    ],
    keywords: ['seguimiento', 'recordatorio', 'avance', 'cumplimiento', 'respuesta'],
    specificInstruction: `
TIPO DOCUMENTAL: NOTA DE SEGUIMIENTO

FINALIDAD
Este documento debe dejar constancia de actuaciones previas y pedir respuesta, avance o cumplimiento.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono formal, sobrio y administrativo.
- Resume gestiones previas, fechas o antecedentes relevantes.
- Señala con claridad qué sigue pendiente o qué respuesta se espera.
- Da prioridad a normas cuya función sea seguimiento_omision, derecho_peticion, transparencia_activa o control_social.
- No conviertas el documento en reclamo emocional ni en escrito sancionatorio.
`.trim()
  },
  {
    key: 'acta_comunitaria',
    name: 'Acta breve comunitaria',
    shortName: 'Acta comunitaria',
    category: 'registro',
    purpose:
      'Registrar acuerdos, hechos, decisiones o mandatos comunitarios de forma clara y usable.',
    defaultTone: 'formal pero comprensible',
    typicalAudience: 'comunidad, dirigencia, organizaciones aliadas o expediente del caso',
    requiresNormativeSupport: false,
    priorityFunctions: [
      'participacion',
      'control_social',
      'coordinacion_interinstitucional',
      'seguimiento_omision'
    ],
    keywords: ['acta', 'comunitaria', 'acuerdos', 'mandato', 'reunión', 'reunion'],
    specificInstruction: `
TIPO DOCUMENTAL: ACTA COMUNITARIA

FINALIDAD
Este documento debe registrar acuerdos, hechos, decisiones o mandatos comunitarios de forma clara y usable.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono formal pero comprensible.
- Deja claro quiénes participaron, qué se discutió y qué acuerdos se adoptaron.
- Si corresponde, registra mandato, respaldo o decisiones para acciones posteriores.
- Da prioridad a normas cuya función sea participacion, control_social o coordinacion_interinstitucional.
- No conviertas el acta en memorial ni en denuncia.
`.trim()
  },
  {
    key: 'cronologia',
    name: 'Cronología del caso',
    shortName: 'Cronología',
    category: 'registro',
    purpose:
      'Ordenar temporalmente los hechos, actuaciones y respuestas institucionales del caso.',
    defaultTone: 'claro y objetivo',
    typicalAudience: 'equipo del caso, autoridades o instancias de apoyo',
    requiresNormativeSupport: false,
    priorityFunctions: [
      'seguimiento_omision',
      'control_social',
      'acceso_informacion'
    ],
    keywords: ['cronología', 'cronologia', 'línea de tiempo', 'hechos', 'secuencia'],
    specificInstruction: `
TIPO DOCUMENTAL: CRONOLOGÍA

FINALIDAD
Este documento debe ordenar temporalmente los hechos, actuaciones y respuestas institucionales del caso.

INSTRUCCIONES ESPECÍFICAS
- Presenta la información en secuencia temporal clara.
- Prioriza fechas, actuaciones, omisiones, visitas, respuestas y eventos relevantes.
- No conviertas la cronología en argumentación extensa.
- Puede incorporar base normativa solo si ayuda a entender la relevancia de un momento clave.
`.trim()
  },
  {
    key: 'presentacion_alt',
    name: 'Presentación a la ALT',
    shortName: 'Presentación ALT',
    category: 'incidencia',
    purpose:
      'Poner en conocimiento un caso con relevancia hídrica, lacustre, sistémica o binacional, solicitando atención técnica, seguimiento o articulación institucional.',
    defaultTone: 'técnico-institucional',
    typicalAudience: 'Autoridad Binacional Autónoma del Sistema Hídrico TDPS (ALT)',
    requiresNormativeSupport: true,
    priorityFunctions: [
      'competencia_alt',
      'competencia_binacional',
      'ruta_binacional',
      'soporte_tecnico',
      'coordinacion_interinstitucional',
      'derecho_al_agua',
      'fundamento_ecosistemico'
    ],
    keywords: ['alt', 'tdps', 'binacional', 'lacustre', 'sistémico', 'sistemico'],
    specificInstruction: `
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
`.trim()
  },
  {
    key: 'presentacion_defensoria',
    name: 'Presentación a la Defensoría del Pueblo',
    shortName: 'Defensoría',
    category: 'incidencia',
    purpose:
      'Comunicar una posible afectación de derechos y/o una omisión institucional, solicitando intervención, seguimiento, exhortación u orientación.',
    defaultTone: 'formal y de tutela de derechos',
    typicalAudience: 'Defensoría del Pueblo',
    requiresNormativeSupport: true,
    priorityFunctions: [
      'proteccion_defensoras',
      'seguimiento_omision',
      'acceso_justicia_ambiental',
      'derecho_ambiental',
      'derecho_al_agua',
      'participacion',
      'control_social'
    ],
    keywords: ['defensoría', 'defensoria', 'derechos', 'tutela', 'intervención', 'intervencion'],
    specificInstruction: `
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
`.trim()
  },
  {
    key: 'memorial_municipio',
    name: 'Memorial al municipio',
    shortName: 'Memorial municipio',
    category: 'incidencia',
    purpose:
      'Presentar formalmente un problema y solicitar actuación municipal concreta.',
    defaultTone: 'formal y administrativo',
    typicalAudience: 'gobierno municipal o unidad municipal competente',
    requiresNormativeSupport: true,
    priorityFunctions: [
      'competencia_municipal',
      'derecho_peticion',
      'inspeccion_fiscalizacion',
      'gestion_riesgos',
      'salud_publica',
      'derecho_ambiental',
      'derecho_al_agua'
    ],
    keywords: ['memorial', 'municipio', 'alcaldía', 'alcaldia', 'gobierno municipal'],
    specificInstruction: `
TIPO DOCUMENTAL: MEMORIAL AL MUNICIPIO

FINALIDAD
Este documento debe presentar formalmente un problema y solicitar actuación municipal concreta.

INSTRUCCIONES ESPECÍFICAS
- Redacta en tono formal, administrativo y claro.
- Enfatiza hechos verificables, afectación local y competencia municipal.
- El petitorio debe ser concreto: inspección, informe, intervención, limpieza, fiscalización, mitigación o seguimiento.
- Da prioridad a normas cuya función sea competencia_municipal, derecho_peticion, inspeccion_fiscalizacion, gestion_riesgos o salud_publica.
- No conviertas el texto en una denuncia penal ni en manifiesto político.
`.trim()
  },
  {
    key: 'minuta_reunion',
    name: 'Minuta de reunión',
    shortName: 'Minuta',
    category: 'registro',
    purpose:
      'Resumir una reunión de trabajo, acuerdos, tareas y próximos pasos.',
    defaultTone: 'claro y ejecutivo',
    typicalAudience: 'participantes de la reunión, equipo del caso o instituciones involucradas',
    requiresNormativeSupport: false,
    priorityFunctions: [
      'participacion',
      'control_social',
      'coordinacion_interinstitucional',
      'seguimiento_omision'
    ],
    keywords: ['minuta', 'reunión', 'reunion', 'acuerdos', 'tareas', 'compromisos'],
    specificInstruction: `
TIPO DOCUMENTAL: MINUTA DE REUNIÓN

FINALIDAD
Este documento debe resumir una reunión de trabajo, acuerdos, tareas y próximos pasos.

INSTRUCCIONES ESPECÍFICAS
- Redacta de forma clara, breve y ordenada.
- Identifica participantes, temas tratados, acuerdos y responsables.
- Si corresponde, deja constancia de compromisos institucionales o comunitarios.
- No conviertas la minuta en acta jurídica compleja ni en memorial.
`.trim()
  },
  {
    key: 'paquete_evidencia',
    name: 'Paquete de evidencia',
    shortName: 'Evidencia',
    category: 'evidencia',
    purpose:
      'Organizar evidencia útil para sustentar el caso y facilitar su revisión por una autoridad o instancia acompañante.',
    defaultTone: 'técnico y trazable',
    typicalAudience: 'autoridad competente, equipo técnico, ALT, municipio o instancia acompañante',
    requiresNormativeSupport: false,
    priorityFunctions: [
      'control_social',
      'inspeccion_fiscalizacion',
      'seguimiento_omision',
      'derecho_ambiental',
      'derecho_al_agua',
      'participacion'
    ],
    keywords: ['paquete', 'evidencia', 'anexos', 'soportes', 'pruebas', 'registro'],
    specificInstruction: `
TIPO DOCUMENTAL: PAQUETE DE EVIDENCIA

FINALIDAD
Este documento debe organizar evidencia útil para sustentar el caso y facilitar su revisión por una autoridad o instancia acompañante.

INSTRUCCIONES ESPECÍFICAS
- Ordena la evidencia de forma clara, trazable y verificable.
- Describe anexos, fotografías, testimonios, fechas, lugares y relación con los hechos.
- Si corresponde, explica brevemente por qué cada pieza fortalece el caso.
- No inventes anexos ni afirmes que existe evidencia no proporcionada.
- No conviertas el paquete en denuncia narrativa extensa.
`.trim()
  }
];

export const documentRegistryByKey: Record<DocumentUseKey, DocumentRegistryItem> =
  Object.fromEntries(
    documentRegistry.map((item) => [item.key, item])
  ) as Record<DocumentUseKey, DocumentRegistryItem>;

export function getDocumentRegistryItem(
  key: DocumentUseKey
): DocumentRegistryItem {
  return documentRegistryByKey[key];
}

export function getDocumentName(key: DocumentUseKey): string {
  return documentRegistryByKey[key]?.name || key;
}

export function getDocumentPriorityFunctions(
  key: DocumentUseKey
): string[] {
  return documentRegistryByKey[key]?.priorityFunctions || [];
}

export function getDocumentSpecificInstruction(
  key: DocumentUseKey
): string {
  return documentRegistryByKey[key]?.specificInstruction || '';
}

export function matchDocumentUseKeyFromName(
  docName: string
): DocumentUseKey | null {
  const normalized = (docName || '').toLowerCase();

  const direct = documentRegistry.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );

  return direct?.key || null;
}