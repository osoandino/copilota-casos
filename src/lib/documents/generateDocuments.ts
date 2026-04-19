import type { CaseRecord } from '$lib/types/case';
import type {
  InstitutionRecommendation,
  SuggestedDocument
} from '$lib/logic/actionRoute';
import type { DocumentUseKey, NormativeSource } from '$lib/types/normative';
import {
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

function canonicalDocumentName(docName: string): string {
  const key = resolveDocumentUseKey(docName);
  return key ? getDocumentName(key) : docName;
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

function detailedEvidenceText(data: CaseRecord) {
  const evidence = data.evidence || [];

  return evidence.length > 0
    ? evidence
        .map((e, i) => {
          return [
            `${i + 1}. EVIDENCIA`,
            `- Tipo: ${e.type || 'Pendiente'}`,
            `- Nombre o referencia: ${e.name || 'Pendiente'}`,
            `- Descripción: ${e.description || 'Pendiente'}`,
            `- Fecha: ${e.date || 'Pendiente'}`,
            `- GPS: ${e.gps || 'Pendiente'}`,
            `- Archivo: ${e.fileName || 'No adjunto'}`
          ].join('\n');
        })
        .join('\n\n')
    : 'No se registró evidencia adjunta todavía.';
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
        `Asunto: Solicitud de intervención y seguimiento respecto al caso ${data.title || 'sin título'}`,
        '',
        'Por la presente se pone en conocimiento de la Defensoría del Pueblo una situación que podría involucrar afectación de derechos y/o insuficiente respuesta institucional.',
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
        '1. Se admita la presente como comunicación de posible afectación de derechos.',
        '2. Se realice seguimiento al caso y a la actuación de las instituciones competentes.',
        '3. Se requiera información, exhortación o intervención institucional, si así se considera pertinente.',
        '4. Se brinde orientación o acompañamiento según corresponda.'
      ].join('\n');

    case 'presentacion_alt':
      return [
        'PRESENTACIÓN A LA ALT',
        '',
        'Dirigido a: Autoridad Binacional Autónoma del Sistema Hídrico TDPS',
        `Asunto: Puesta en conocimiento y solicitud de atención técnica respecto al caso ${data.title || 'sin título'}`,
        '',
        'Por la presente se pone en conocimiento de la ALT una situación con posible relevancia hídrica, lacustre o sistémica:',
        '',
        'IDENTIFICACIÓN DEL CASO',
        `- Título del caso: ${data.title || '[pendiente]'}`,
        `- Lugar o área afectada: ${data.location || '[pendiente]'}`,
        `- Comunidad o población involucrada: ${data.community || '[pendiente]'}`,
        `- Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
        '',
        'HECHOS RELEVANTES',
        data.narrative || '[Relato pendiente]',
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
        '1. Se tenga presente la información del caso en el marco de las atribuciones técnicas e institucionales de la ALT.',
        '2. Se valore la pertinencia de seguimiento técnico, coordinación interinstitucional o atención especializada según corresponda.',
        '3. Se informe, en su caso, si existen antecedentes, monitoreos, articulaciones o recomendaciones relacionadas con el área afectada.'
      ].join('\n');

    case 'memorial_municipio':
      return [
        'MEMORIAL AL MUNICIPIO',
        '',
        `Dirigido a: ${destination}`,
        `Asunto: Solicitud de actuación municipal respecto al caso ${data.title || 'sin título'}`,
        '',
        `Quien suscribe, en representación de ${data.community || 'la comunidad afectada'}, pone en conocimiento de su autoridad la siguiente situación:`,
        '',
        'HECHOS RELEVANTES',
        data.narrative || '[Relato pendiente]',
        '',
        'IDENTIFICACIÓN DEL CASO',
        `- Lugar: ${data.location || '[pendiente]'}`,
        `- Tipo de problema: ${data.problemType || '[pendiente]'}`,
        `- Personas o grupos afectados: ${data.affectedPeople || '[pendiente]'}`,
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
        '1. Se tenga por presentado el presente memorial.',
        '2. Se identifique la unidad municipal competente.',
        '3. Se adopten medidas de inspección, seguimiento, respuesta o coordinación institucional, según corresponda.',
        '4. Se responda formalmente por escrito dentro de plazo razonable.'
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
        'INVENTARIO DE EVIDENCIA',
        evidenceDetailed,
        '',
        'GESTIONES PREVIAS',
        previousActions,
        '',
        'OBSERVACIONES',
        'Este paquete resume la evidencia comunitaria registrada para fines de seguimiento, presentación institucional y respaldo documental.'
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