import type { CaseRecord } from '$lib/types/case';
import type {
  InstitutionRecommendation,
  SuggestedDocument
} from '$lib/logic/actionRoute';
import type { DocumentUseKey, NormativeSource } from '$lib/types/normative';
import {
  documentRegistry,
  getDocumentName,
  matchDocumentUseKeyFromName
} from '$lib/config/documentRegistry';

export type GeneratedDocument = {
  name: string;
  content: string;
};

function resolveDocumentUseKey(docName: string): DocumentUseKey | null {
  return matchDocumentUseKeyFromName(docName);
}

function normativeSupportText(
  data: CaseRecord,
  docKey: DocumentUseKey | null,
  normativeSources: NormativeSource[]
) {
  if (!docKey) return 'Sin base normativa seleccionada para este documento.';

  const selected = (data.normativeMatches || [])
    .filter((m) => m.selectedForUse && (m.selectedForDocuments || []).includes(docKey))
    .map((m) => {
      const source = normativeSources.find((n) => n.id === m.normativeSourceId);
      return source ? `${source.normTitle}, ${source.article}` : `Norma ${m.normativeSourceId}`;
    });

  if (selected.length === 0) {
    return 'Sin base normativa seleccionada para este documento.';
  }

  return selected.join('; ');
}

function evidenceListText(data: CaseRecord) {
  const evidence = data.evidence || [];

  return evidence.length > 0
    ? evidence
        .map((e, i) => {
          const name = e.name || e.description || 'sin referencia';
          const type = e.type || 'Evidencia';
          const date = e.date ? ` | fecha: ${e.date}` : '';
          const gps = e.gps ? ` | gps: ${e.gps}` : '';
          const file = e.fileName ? ` | archivo: ${e.fileName}` : '';
          return `${i + 1}. ${type} - ${name}${date}${gps}${file}`;
        })
        .join('\n')
    : 'No se registró evidencia adjunta todavía.';
}

function assessEvidenceItem(e: {
  type?: string;
  name?: string;
  description?: string;
  whatItShows?: string;
  gps?: string;
  date?: string;
  fileName?: string;
}) {
  const missing: string[] = [];

  if (!(e.type || e.name)) {
    missing.push('tipo o nombre de referencia');
  }

  if (!e.whatItShows) {
    missing.push('qué demuestra');
  }

  if (!e.description) {
    missing.push('descripción');
  }

  if (!(e.date || e.gps || e.fileName)) {
    missing.push('fecha, GPS o archivo de respaldo');
  }

  let status: 'sólida' | 'parcial' | 'débil' = 'sólida';
  if (missing.length === 1) status = 'parcial';
  if (missing.length >= 2) status = 'débil';

  return {
    missing,
    status
  };
}

function detailedEvidenceText(data: CaseRecord) {
  const evidence = data.evidence || [];

  return evidence.length > 0
    ? evidence
        .map((e, i) => {
          const assessed = assessEvidenceItem(e);

          return [
            `${i + 1}. EVIDENCIA`,
            `- Estado de completitud: ${assessed.status}`,
            `- Tipo: ${e.type || 'Pendiente'}`,
            `- Nombre o referencia: ${e.name || 'Pendiente'}`,
            `- Descripción: ${e.description || 'Pendiente'}`,
            `- Qué demuestra: ${e.whatItShows || 'Pendiente'}`,
            `- Fecha: ${e.date || 'Pendiente'}`,
            `- GPS: ${e.gps || 'Pendiente'}`,
            `- Archivo: ${e.fileName || 'No adjunto'}`,
            `- Vacíos detectados: ${
              assessed.missing.length > 0 ? assessed.missing.join('; ') : 'sin vacíos críticos'
            }`
          ].join('\n');
        })
        .join('\n\n')
    : 'No se registró evidencia adjunta todavía.';
}

function evidenceCompletenessSummaryText(data: CaseRecord) {
  const evidence = data.evidence || [];

  if (evidence.length === 0) {
    return [
      'Total de evidencias registradas: 0',
      'Evidencias con metadatos mínimos: 0',
      'Evidencias parciales: 0',
      'Evidencias débiles: 0',
      'Observación general: todavía no existe evidencia registrada para sustentar el caso.'
    ].join('\n');
  }

  const assessed = evidence.map((e) => assessEvidenceItem(e));
  const solid = assessed.filter((a) => a.status === 'sólida').length;
  const partial = assessed.filter((a) => a.status === 'parcial').length;
  const weak = assessed.filter((a) => a.status === 'débil').length;

  return [
    `Total de evidencias registradas: ${evidence.length}`,
    `Evidencias con metadatos mínimos: ${solid}`,
    `Evidencias parciales: ${partial}`,
    `Evidencias débiles: ${weak}`,
    solid === evidence.length
      ? 'Observación general: el conjunto de evidencia tiene una base razonablemente completa para revisión.'
      : 'Observación general: conviene completar metadatos faltantes antes de una presentación institucional más fuerte.'
  ].join('\n');
}

function evidenceCriticalGapsText(data: CaseRecord) {
  const evidence = data.evidence || [];

  if (evidence.length === 0) {
    return 'No existe evidencia registrada. Es prioritario incorporar al menos fotografías, registro descriptivo y referencia temporal o espacial.';
  }

  const gapCounter = new Map<string, number>();

  evidence.forEach((e) => {
    const assessed = assessEvidenceItem(e);
    assessed.missing.forEach((gap) => {
      gapCounter.set(gap, (gapCounter.get(gap) || 0) + 1);
    });
  });

  if (gapCounter.size === 0) {
    return 'No se detectan vacíos críticos generales en la evidencia registrada.';
  }

  return [...gapCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([gap, count], i) => `${i + 1}. ${gap}: faltante en ${count} evidencia(s).`)
    .join('\n');
}

function evidencePresentationReadinessText(data: CaseRecord) {
  const evidence = data.evidence || [];

  if (evidence.length === 0) {
    return 'El expediente todavía no está listo para un paquete de evidencia, porque no cuenta con soportes registrados.';
  }

  const assessed = evidence.map((e) => assessEvidenceItem(e));
  const solid = assessed.filter((a) => a.status === 'sólida').length;

  if (solid === evidence.length) {
    return 'La evidencia registrada presenta un nivel razonable de completitud para acompañar presentaciones institucionales, aunque siempre puede fortalecerse con mayor precisión técnica.';
  }

  if (solid >= Math.ceil(evidence.length / 2)) {
    return 'El expediente cuenta con una base útil de evidencia, pero conviene completar metadatos y soportes faltantes antes de una presentación de mayor exigencia.';
  }

  return 'La evidencia todavía es insuficiente o desigual en calidad. Conviene reforzar descripción, referencia temporal/espacial y respaldo documental o fotográfico antes de una presentación formal.';
}

function previousActionsText(data: CaseRecord) {
  const lines: string[] = [];

  if (data.authorityContacted) {
    lines.push(`- Autoridad o instancia contactada: ${data.authorityContacted}`);
  }

  if (data.authorityResponse) {
    lines.push(`- Respuesta institucional registrada: ${data.authorityResponse}`);
  }

  if (lines.length === 0) {
    return 'No se cuenta con gestiones previas registradas de manera precisa.';
  }

  return lines.join('\n');
}

function requestedInfoItems(data: CaseRecord) {
  const base = [
    '1. actuaciones realizadas o previstas respecto al caso reportado;',
    '2. unidad responsable, instancia competente y personal encargado;',
    '3. informes técnicos, inspecciones, monitoreos o verificaciones existentes;',
    '4. medidas adoptadas, cronograma previsto y plazos de respuesta;'
  ];

  const text = [data.title, data.narrative, data.problemType, data.location]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    text.includes('ptar') ||
    text.includes('aguas residuales') ||
    text.includes('alcantarillado') ||
    text.includes('descarga')
  ) {
    base.push(
      '5. licencias, autorizaciones, reportes operativos o antecedentes vinculados a la infraestructura sanitaria o punto de descarga;'
    );
    base.push(
      '6. resultados de muestreo, control o monitoreo de calidad de agua, si existieran;'
    );
  }

  if (
    text.includes('cohana') ||
    text.includes('katari') ||
    text.includes('lago') ||
    text.includes('tdps')
  ) {
    base.push(
      '5. antecedentes de monitoreo hídrico, reportes técnicos, coordinación interinstitucional o documentos relacionados con el área afectada;'
    );
  }

  return base.join('\n');
}

function currentDateText() {
  return new Date().toLocaleDateString();
}

export function caseSummaryText(
  data: CaseRecord,
  normativeSources: NormativeSource[]
): string {
  const evidence = data.evidence || [];
  const evidenceText =
    evidence.length > 0
      ? evidence
          .map(
            (e, i) =>
              `${i + 1}. ${e.type} | ${e.name || 'sin nombre'} | ${e.description || 'sin descripción'} | ${e.date || 'sin fecha'} | ${e.gps || 'sin gps'}`
          )
          .join('\n')
      : 'No hay evidencia registrada.';

  return [
    'FICHA RESUMIDA DEL CASO',
    '',
    `ID: ${data.id}`,
    `Título: ${data.title || 'Sin título'}`,
    `Comunidad: ${data.community || 'Pendiente'}`,
    `Lugar: ${data.location || 'Pendiente'}`,
    `Inicio del problema: ${data.dateStarted || 'Pendiente'}`,
    `Reporta: ${data.reporter || 'Pendiente'}`,
    `Tipo de problema: ${data.problemType || 'Pendiente'}`,
    `Afectados: ${data.affectedPeople || 'Pendiente'}`,
    `Estado: ${data.status}`,
    '',
    'RELATO',
    data.narrative || 'Sin relato registrado.',
    '',
    'EVIDENCIA',
    evidenceText,
    '',
    'SEGUIMIENTO',
    `Autoridad contactada: ${data.authorityContacted || 'No registrada'}`,
    `Respuesta: ${data.authorityResponse || 'No registrada'}`,
    '',
    'BASE NORMATIVA SELECCIONADA',
    normativeSupportText(data, 'ficha_resumen', normativeSources)
  ].join('\n');
}

export function generateDocumentByType(
  docName: string,
  data: CaseRecord,
  institutionRecommendation: InstitutionRecommendation | null,
  normativeSources: NormativeSource[]
): string {
  const docKey = resolveDocumentUseKey(docName);
  const issue = data.problemType || 'situación reportada';
  const destination =
    institutionRecommendation?.primary || data.authorityContacted || 'Autoridad competente';

  const evidenceList = evidenceListText(data);
  const evidenceDetailed = detailedEvidenceText(data);
  const normativeBlock = normativeSupportText(data, docKey, normativeSources);
  const previousActions = previousActionsText(data);

  switch (docKey) {
    case 'ficha_resumen':
      return caseSummaryText(data, normativeSources);

    case 'solicitud_informacion':
      return [
        'SOLICITUD DE INFORMACIÓN',
        '',
        `Dirigido a: ${destination}`,
        `Asunto: Solicitud de información respecto al caso ${data.title || 'sin título'}`,
        '',
        `Por medio de la presente se solicita información vinculada al caso reportado por ${data.community || 'la comunidad'}, relativo a ${issue.toLowerCase()}.`,
        '',
        'IDENTIFICACIÓN DEL CASO',
        `- Título del caso: ${data.title || '[pendiente]'}`,
        `- Lugar: ${data.location || '[pendiente]'}`,
        `- Comunidad o población afectada: ${data.community || '[pendiente]'}`,
        `- Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
        '',
        'HECHOS RELEVANTES',
        data.narrative || '[Relato pendiente]',
        '',
        'INFORMACIÓN REQUERIDA',
        requestedInfoItems(data),
        '',
        'ANTECEDENTES DE GESTIÓN',
        previousActions,
        '',
        'EVIDENCIA DISPONIBLE',
        evidenceList,
        '',
        'BASE NORMATIVA SELECCIONADA',
        normativeBlock,
        '',
        'Se solicita respuesta escrita, clara y completa, con remisión de la documentación pertinente si existiera.'
      ].join('\n');

    case 'solicitud_inspeccion':
      return [
        'SOLICITUD DE INSPECCIÓN',
        '',
        `Dirigido a: ${destination}`,
        `Asunto: Solicitud de inspección y verificación técnica por ${issue.toLowerCase()}`,
        '',
        `Quien suscribe pone en conocimiento de su autoridad la siguiente situación reportada por ${data.community || 'la comunidad'}:`,
        data.narrative || '[Relato pendiente]',
        '',
        'IDENTIFICACIÓN DEL CASO',
        `- Título del caso: ${data.title || '[pendiente]'}`,
        `- Lugar afectado: ${data.location || '[pendiente]'}`,
        `- Comunidad o población afectada: ${data.community || '[pendiente]'}`,
        `- Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
        '',
        'EVIDENCIA DISPONIBLE',
        evidenceList,
        '',
        'BASE NORMATIVA SELECCIONADA',
        normativeBlock,
        '',
        'PETITORIO',
        '1. Se disponga inspección en sitio a la zona reportada.',
        '2. Se realice verificación técnica de los hechos denunciados.',
        '3. Cuando corresponda, se efectúe constatación de descargas, rebalses, residuos, afectación hídrica u otras fuentes de daño.',
        '4. Cuando corresponda, se considere toma de muestras o medidas técnicas equivalentes.',
        '5. Se informe por escrito sobre resultados, medidas inmediatas y acciones posteriores.',
        '',
        'Se solicita respuesta formal dentro de plazo razonable y registro de las actuaciones realizadas.'
      ].join('\n');

    case 'nota_seguimiento':
      return [
        'NOTA DE SEGUIMIENTO',
        '',
        `Dirigido a: ${data.authorityContacted || destination}`,
        `Asunto: Seguimiento al caso ${data.title || 'sin título'}`,
        '',
        `Por la presente se realiza seguimiento al caso reportado por ${data.community || 'la comunidad'}.`,
        '',
        'ANTECEDENTES',
        previousActions,
        '',
        'HECHOS RELEVANTES',
        data.narrative || '[Relato pendiente]',
        '',
        'BASE NORMATIVA SELECCIONADA',
        normativeBlock,
        '',
        'Se solicita actualización escrita sobre las acciones adoptadas, resultados obtenidos y próximos pasos institucionales.'
      ].join('\n');

    case 'acta_comunitaria':
      return [
        'ACTA BREVE COMUNITARIA',
        '',
        `Comunidad: ${data.community || '[pendiente]'}`,
        `Caso: ${data.title || '[pendiente]'}`,
        `Fecha: ${currentDateText()}`,
        '',
        'Resumen del problema:',
        data.narrative || '[Relato pendiente]',
        '',
        `Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
        '',
        'Base normativa seleccionada:',
        normativeBlock,
        '',
        'Acuerdos preliminares:',
        '1. consolidar la evidencia disponible;',
        '2. validar el relato del caso;',
        '3. definir presentación ante la institución sugerida.'
      ].join('\n');

    case 'cronologia': {
      const events = (data.events || [])
        .slice()
        .sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

      const lines =
        events.length > 0
          ? events
              .map(
                (evt, i) =>
                  `${i + 1}. ${new Date(evt.createdAt || Date.now()).toLocaleString()} - ${evt.label}${evt.notes ? ` | ${evt.notes}` : ''}`
              )
              .join('\n')
          : 'Sin eventos registrados.';

      return [
        'CRONOLOGÍA DEL CASO',
        '',
        `Caso: ${data.title || 'Sin título'}`,
        `Comunidad: ${data.community || '[pendiente]'}`,
        '',
        'Base normativa seleccionada:',
        normativeBlock,
        '',
        lines
      ].join('\n');
    }

    case 'presentacion_defensoria':
      return [
        'PRESENTACIÓN A LA DEFENSORÍA DEL PUEBLO',
        '',
        'Dirigido a: Defensoría del Pueblo',
        `Asunto: Puesta en conocimiento y solicitud de intervención defensorial respecto al caso ${data.title || 'sin título'}`,
        '',
        'Por la presente se pone en conocimiento de la Defensoría del Pueblo una situación que, de acuerdo con la información registrada, podría involucrar afectación de derechos y/o una respuesta institucional insuficiente frente a hechos que impactan a personas, comunidad o territorio.',
        '',
        'IDENTIFICACIÓN DEL CASO',
        `- Título del caso: ${data.title || '[pendiente]'}`,
        `- Lugar: ${data.location || '[pendiente]'}`,
        `- Comunidad o población afectada: ${data.community || '[pendiente]'}`,
        `- Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
        `- Tipo de problema reportado: ${data.problemType || '[pendiente]'}`,
        '',
        'HECHOS RELEVANTES',
        data.narrative || '[Relato pendiente]',
        '',
        'AFECTACIÓN Y PREOCUPACIÓN DE DERECHOS',
        `De acuerdo con la información disponible, la situación descrita podría comprometer derechos vinculados al agua, al ambiente, a la salud, a la participación o a la debida atención institucional, afectando a ${data.affectedPeople || 'la población involucrada'} y justificando seguimiento desde la Defensoría del Pueblo.`,
        '',
        'GESTIONES PREVIAS',
        previousActions,
        '',
        'EVIDENCIA DISPONIBLE',
        evidenceList,
        '',
        'BASE NORMATIVA SELECCIONADA',
        normativeBlock,
        '',
        'PETITORIO',
        '1. Se tenga por presentada la presente comunicación como puesta en conocimiento de una posible afectación de derechos.',
        '2. Se valore la apertura de seguimiento defensorial al caso y a la actuación de las instituciones competentes.',
        '3. Se requiera, cuando corresponda, información a las instancias involucradas sobre actuaciones, omisiones, medidas adoptadas o respuesta pendiente.',
        '4. Se considere la emisión de exhortación, recomendación, acompañamiento u orientación institucional, según corresponda.',
        '5. Se comunique a la parte interesada cualquier criterio, actuación o canal adicional que permita fortalecer la protección y seguimiento del caso.',
        '',
        'OTROSÍ',
        'Se adjunta la evidencia comunitaria disponible como respaldo preliminar del caso, sin perjuicio de posteriores ampliaciones, verificaciones o complementaciones.'
      ].join('\n');

    case 'presentacion_alt':
      return [
        'PRESENTACIÓN A LA ALT',
        '',
        'Dirigido a: Autoridad Binacional Autónoma del Sistema Hídrico TDPS',
        `Asunto: Puesta en conocimiento y solicitud de consideración técnica respecto al caso ${data.title || 'sin título'}`,
        '',
        'Por la presente se pone en conocimiento de la Autoridad Binacional Autónoma del Sistema Hídrico TDPS una situación que, de acuerdo con la información registrada, podría tener relevancia hídrica, lacustre, territorial o sistémica en el ámbito del sistema TDPS y que amerita consideración técnica e institucional según corresponda.',
        '',
        'IDENTIFICACIÓN DEL CASO',
        `- Título del caso: ${data.title || '[pendiente]'}`,
        `- Lugar o área afectada: ${data.location || '[pendiente]'}`,
        `- Comunidad o población involucrada: ${data.community || '[pendiente]'}`,
        `- Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
        `- Tipo de problema reportado: ${data.problemType || '[pendiente]'}`,
        '',
        'HECHOS RELEVANTES',
        data.narrative || '[Relato pendiente]',
        '',
        'RELEVANCIA DEL CASO PARA LA GESTIÓN DEL AGUA',
        'Con base en la información disponible, el caso podría involucrar afectaciones o riesgos vinculados al agua, al entorno lacustre, a usos comunitarios del territorio o a dinámicas que requieren mejor articulación de información y seguimiento entre actores competentes.',
        '',
        'GESTIONES PREVIAS',
        previousActions,
        '',
        'EVIDENCIA DISPONIBLE',
        evidenceList,
        '',
        'BASE NORMATIVA SELECCIONADA',
        normativeBlock,
        '',
        'PETITORIO',
        '1. Se tenga por presentada la presente comunicación y por puesta en conocimiento la situación descrita.',
        '2. Se valore la pertinencia de revisión técnica, consideración institucional o seguimiento dentro del marco de competencias de la ALT.',
        '3. Se informe, en su caso, si existen antecedentes, monitoreos, reportes, estudios, acciones previas o mecanismos de articulación relacionados con el área o problemática reportada.',
        '4. Se considere, cuando corresponda, la orientación técnica o la articulación con las instancias competentes para el tratamiento del caso.',
        '5. Se comunique, en la medida de lo posible, cualquier información o criterio técnico relevante que contribuya al seguimiento del expediente.',
        '',
        'OTROSÍ',
        'Se adjunta la evidencia comunitaria disponible como respaldo preliminar del caso, sin perjuicio de posteriores ampliaciones, verificaciones o complementaciones.'
      ].join('\n');

    case 'memorial_municipio':
      return [
        'MEMORIAL AL MUNICIPIO',
        '',
        `Dirigido a: ${destination}`,
        `Asunto: Puesta en conocimiento y solicitud de actuación municipal respecto al caso ${data.title || 'sin título'}`,
        '',
        `Quien suscribe, en representación de ${data.community || 'la comunidad afectada'}, pone en conocimiento de su autoridad la siguiente situación que estaría generando afectaciones en el ámbito local y que requiere atención municipal conforme a las competencias que correspondan.`,
        '',
        'IDENTIFICACIÓN DEL CASO',
        `- Título del caso: ${data.title || '[pendiente]'}`,
        `- Lugar: ${data.location || '[pendiente]'}`,
        `- Comunidad o población afectada: ${data.community || '[pendiente]'}`,
        `- Tipo de problema: ${data.problemType || '[pendiente]'}`,
        `- Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
        '',
        'HECHOS RELEVANTES',
        data.narrative || '[Relato pendiente]',
        '',
        'AFECTACIÓN REPORTADA',
        `De acuerdo con la información registrada, la situación descrita estaría afectando a ${data.affectedPeople || 'la población involucrada'} y amerita revisión municipal por sus posibles implicaciones ambientales, sanitarias, territoriales o de gestión local, según corresponda.`,
        '',
        'GESTIONES PREVIAS',
        previousActions,
        '',
        'EVIDENCIA DISPONIBLE',
        evidenceList,
        '',
        'BASE NORMATIVA SELECCIONADA',
        normativeBlock,
        '',
        'PETITORIO',
        '1. Se tenga por presentado el presente memorial y por puesta en conocimiento la situación descrita.',
        '2. Se identifique y active la unidad municipal competente para conocer el caso.',
        '3. Se disponga, cuando corresponda, inspección, verificación en sitio o revisión técnica/administrativa de los hechos reportados.',
        '4. Se evalúe la adopción de medidas de atención, mitigación, fiscalización, limpieza, seguimiento o coordinación institucional, según la naturaleza del caso.',
        '5. Se emita respuesta formal por escrito, señalando actuaciones realizadas, instancia responsable y pasos siguientes.',
        '',
        'OTROSÍ',
        'Se adjunta la evidencia comunitaria disponible como respaldo preliminar del caso, sin perjuicio de posteriores ampliaciones o complementaciones.'
      ].join('\n');

    case 'minuta_reunion':
      return [
        'MINUTA DE REUNIÓN',
        '',
        `Fecha: ${currentDateText()}`,
        `Caso: ${data.title || '[pendiente]'}`,
        `Comunidad: ${data.community || '[pendiente]'}`,
        `Lugar o área afectada: ${data.location || '[pendiente]'}`,
        '',
        'OBJETO DE LA REUNIÓN',
        `Revisión del caso relacionado con ${issue.toLowerCase()}.`,
        '',
        'RESUMEN DEL CASO',
        data.narrative || '[Relato pendiente]',
        '',
        'EVIDENCIA REVISADA',
        evidenceList,
        '',
        'BASE NORMATIVA RELEVANTE',
        normativeBlock,
        '',
        'ACUERDOS / PUNTOS DE SEGUIMIENTO',
        '1. Validar hechos y evidencia disponible.',
        '2. Confirmar institución competente y ruta de acción.',
        '3. Definir siguientes gestiones y responsables.',
        '4. Registrar fecha tentativa de seguimiento.'
      ].join('\n');

    case 'paquete_evidencia':
      return [
        'PAQUETE DE EVIDENCIA',
        '',
        `Caso: ${data.title || '[pendiente]'}`,
        `ID del caso: ${data.id}`,
        `Comunidad: ${data.community || '[pendiente]'}`,
        `Lugar: ${data.location || '[pendiente]'}`,
        `Fecha de compilación: ${currentDateText()}`,
        '',
        'DESCRIPCIÓN GENERAL DEL CASO',
        data.narrative || '[Relato pendiente]',
        '',
        'PERSONAS O GRUPOS AFECTADOS',
        data.affectedPeople || '[pendiente]',
        '',
        'INSTITUCIÓN O RUTA RELACIONADA',
        institutionRecommendation?.primary || data.authorityContacted || '[pendiente]',
        '',
        'BASE NORMATIVA SELECCIONADA',
        normativeBlock,
        '',
        'RESUMEN DE COMPLETITUD DE EVIDENCIA',
        evidenceCompletenessSummaryText(data),
        '',
        'VACÍOS CRÍTICOS IDENTIFICADOS',
        evidenceCriticalGapsText(data),
        '',
        'INVENTARIO POR TIPO DE EVIDENCIA',
        groupedEvidenceInventoryText(data),
        '',
        'DETALLE INDIVIDUAL DE EVIDENCIA',
        evidenceDetailed,
        '',
        'GESTIONES PREVIAS',
        previousActions,
        '',
        'OBSERVACIONES DE TRAZABILIDAD Y PREPARACIÓN',
        evidencePresentationReadinessText(data),
        '',
        'OBSERVACIÓN FINAL',
        'Este paquete organiza la evidencia comunitaria registrada para fines de seguimiento, presentación institucional y fortalecimiento del expediente.'
      ].join('\n');

    default:
      return [
        'DOCUMENTO BASE',
        '',
        `Caso: ${data.title || 'Sin título'}`,
        data.narrative || '[Sin contenido]',
        '',
        'Base normativa seleccionada:',
        normativeBlock
      ].join('\n');
  }
}

    const evidenceTypeOrder = [
      'Documento oficial',
      'Informe técnico',
      'Muestra / análisis',
      'Acta',
      'Documento comunitario',
      'Mapa / croquis',
      'Registro GPS',
      'Fotografía',
      'Video',
      'Audio',
      'Testimonio',
      'Otro'
    ] as const;

    function normalizeEvidenceType(type?: string): string {
      const t = (type || '').toLowerCase().trim();

      if (!t) return 'Otro';
      if (t.includes('foto')) return 'Fotografía';
      if (t.includes('video')) return 'Video';
      if (t.includes('audio')) return 'Audio';
      if (t.includes('testimonio')) return 'Testimonio';
      if (t.includes('documento oficial')) return 'Documento oficial';
      if (t.includes('documento comunitario')) return 'Documento comunitario';
      if (t.includes('acta')) return 'Acta';
      if (t.includes('mapa') || t.includes('croquis')) return 'Mapa / croquis';
      if (t.includes('gps')) return 'Registro GPS';
      if (t.includes('informe')) return 'Informe técnico';
      if (t.includes('muestra') || t.includes('análisis') || t.includes('analisis')) {
        return 'Muestra / análisis';
      }

      return 'Otro';
    }

    function groupedEvidenceInventoryText(data: CaseRecord) {
      const evidence = data.evidence || [];

      if (evidence.length === 0) {
        return 'No existe evidencia registrada para clasificar por categorías.';
      }

      const grouped = new Map<string, typeof evidence>();

      evidence.forEach((e) => {
        const groupLabel = normalizeEvidenceType(e.type);

        if (!grouped.has(groupLabel)) {
          grouped.set(groupLabel, []);
        }

        grouped.get(groupLabel)!.push(e);
      });

      const orderedGroups = [
        ...evidenceTypeOrder.filter((label) => grouped.has(label)),
        ...[...grouped.keys()]
          .filter((label) => !evidenceTypeOrder.includes(label as (typeof evidenceTypeOrder)[number]))
          .sort()
      ];

      return orderedGroups
        .map((label) => {
          const items = grouped.get(label) || [];

          return [
            `${label.toUpperCase()} (${items.length})`,
            '',
            items
              .map((e, i) => {
                const assessed = assessEvidenceItem(e);

                return [
                  `${i + 1}. ${e.name || 'Sin nombre de referencia'}`,
                  `- Estado: ${assessed.status}`,
                  `- Qué demuestra: ${e.whatItShows || 'Pendiente'}`,
                  `- Descripción: ${e.description || 'Pendiente'}`,
                  `- Fecha: ${e.date || 'Pendiente'}`,
                  `- GPS: ${e.gps || 'Pendiente'}`,
                  `- Archivo: ${e.fileName || 'No adjunto'}`
                ].join('\n');
              })
              .join('\n\n')
          ].join('\n');
        })
        .join('\n\n');
    }

export function buildGeneratedDocuments(
  data: CaseRecord,
  institutionRecommendation: InstitutionRecommendation | null,
  suggestedDocuments: SuggestedDocument[],
  normativeSources: NormativeSource[]
): GeneratedDocument[] {
  const uniqueDocs: GeneratedDocument[] = [];
  const seen = new Set<string>();

  const allSuggested = [{ name: getDocumentName('ficha_resumen') }, ...suggestedDocuments];

  allSuggested.forEach((doc) => {
    const key = resolveDocumentUseKey(doc.name);
    const canonicalName = key ? getDocumentName(key) : doc.name;
    const dedupeKey = key || canonicalName;

    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      uniqueDocs.push({
        name: canonicalName,
        content: generateDocumentByType(
          canonicalName,
          data,
          institutionRecommendation,
          normativeSources
        )
      });
    }
  });

  return uniqueDocs;
}