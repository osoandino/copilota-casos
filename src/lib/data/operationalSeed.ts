import type { ActionPattern } from '$lib/types/operational';

export const operationalSeed: ActionPattern[] = [
  {
    id: 'TOP-01-PTAR',
    topCode: '1',
    label: 'Descargas de aguas residuales / PTAR fallida / rebalses',
    shortDescription:
      'Casos de descargas, rebalses, olores, espuma, coloración anómala o fallas de alcantarillado/PTAR que afectan cuerpos de agua.',
    municipalities: ['COP', 'HUA', 'DES', 'PP', 'PUC'],
    signals: [
      'olor fuerte',
      'espuma',
      'color oscuro',
      'canal',
      'tubo al lago',
      'rebalse',
      'ptar',
      'aguas residuales'
    ],
    minimumEvidence: [
      { id: 'ptar-e1', label: 'Ubicación o croquis del punto de descarga', required: true },
      { id: 'ptar-e2', label: 'Fotos o video del hecho', required: true },
      { id: 'ptar-e3', label: 'Fecha y hora del evento', required: true },
      { id: 'ptar-e4', label: 'Testigos o personas que puedan confirmar', required: true },
      { id: 'ptar-e5', label: 'Descripción de olor, color, espuma o impacto', required: true }
    ],
    primaryRoute: [
      'Presentar solicitud de inspección y muestreo ante el GAM/UMAs/Saneamiento',
      'Solicitar información sobre licencias, monitoreos, auditorías o caudales'
    ],
    escalationRoute: [
      'Escalar a autoridad ambiental departamental o nacional',
      'Acudir a Defensoría si hay omisión persistente',
      'Evaluar acción colectiva o popular si la afectación es grave'
    ],
    typicalAuthorities: [
      'GAM',
      'Unidad de Medio Ambiente',
      'Saneamiento/Obras',
      'Autoridad ambiental',
      'Defensoría'
    ],
    templateKeys: [
      'solicitud_inspeccion',
      'solicitud_informacion',
      'nota_seguimiento',
      'acta_comunitaria'
    ],
    normativeHintIds: [
      'BOL-CPE-01',
      'BOL-CPE-03',
      'BOL-ENV-01',
      'BOL-WATSERV-01',
      'BOL-WATSERV-02'
    ],
    urgency: 'alta',
    notes: 'Caso operativo prioritario para contaminación hídrica por infraestructura sanitaria deficiente.'
  },
  {
    id: 'TOP-02-RESIDUOS',
    topCode: '2',
    label: 'Residuos sólidos: botaderos, quema, microbasurales y plásticos en ribera',
    shortDescription:
      'Casos de basura acumulada, botaderos informales, quema de residuos y contaminación de ribera o espacio público.',
    municipalities: ['COP', 'HUA', 'PP', 'PUC', 'DES'],
    signals: [
      'basura',
      'botadero',
      'quema',
      'lixiviados',
      'microbasural',
      'plásticos en ribera'
    ],
    minimumEvidence: [
      { id: 'res-e1', label: 'Ubicación del punto crítico', required: true },
      { id: 'res-e2', label: 'Fotos o video', required: true },
      { id: 'res-e3', label: 'Frecuencia o reiteración del problema', required: true },
      { id: 'res-e4', label: 'Identificación de responsable si se conoce', required: false },
      { id: 'res-e5', label: 'Testigos o firmas de apoyo', required: false }
    ],
    primaryRoute: [
      'Presentar denuncia municipal por botadero, quema o acumulación',
      'Solicitar Plan GIR, presupuesto, cronograma y responsables'
    ],
    escalationRoute: [
      'Escalar a Gobernación o autoridad ambiental por omisión grave',
      'Activar control social y Defensoría si no hay respuesta'
    ],
    typicalAuthorities: [
      'GAM',
      'Aseo urbano',
      'Unidad de Medio Ambiente',
      'Gobernación',
      'Defensoría'
    ],
    templateKeys: [
      'solicitud_inspeccion',
      'solicitud_informacion',
      'nota_seguimiento',
      'acta_comunitaria'
    ],
    normativeHintIds: [
      'BOL-ENV-01',
      'BOL-WASTE-01',
      'BOL-WASTE-02',
      'BOL-RISK-03'
    ],
    urgency: 'media'
  },
  {
    id: 'TOP-03-COHANA',
    topCode: '3',
    label: 'Contaminación crónica Katari – Cohana – Lago Menor',
    shortDescription:
      'Casos de eutrofización, agua verde, algas, mortandad de peces, pérdida de pesca y deterioro prolongado en el lago menor y bahías asociadas.',
    municipalities: ['PP', 'PUC', 'HUA', 'ALL'],
    signals: [
      'agua verde',
      'algas',
      'olor fuerte',
      'mortandad de peces',
      'agua no usable para ganado',
      'cohana',
      'katari'
    ],
    minimumEvidence: [
      { id: 'coh-e1', label: 'Registro fotográfico en más de una fecha', required: true },
      { id: 'coh-e2', label: 'Mapa o croquis de zona afectada', required: true },
      { id: 'coh-e3', label: 'Bitácora de impactos en pesca, ganado o salud', required: true },
      { id: 'coh-e4', label: 'Testimonios comunitarios', required: true }
    ],
    primaryRoute: [
      'Solicitar monitoreo de agua y sedimento',
      'Pedir plan de mitigación y cronograma con responsables',
      'Exigir publicación de resultados'
    ],
    escalationRoute: [
      'Escalar a instancias sectoriales y Defensoría',
      'Elevar incidencia hacia ALT cuando el caso tenga dimensión sistémica o binacional'
    ],
    typicalAuthorities: [
      'GAM',
      'Autoridad ambiental',
      'MMAyA',
      'Defensoría',
      'ALT'
    ],
    templateKeys: [
      'solicitud_inspeccion',
      'solicitud_informacion',
      'nota_seguimiento',
      'acta_comunitaria'
    ],
    normativeHintIds: [
      'BOL-CPE-01',
      'BOL-CPE-02',
      'BOL-MT-02',
      'BOL-MT-03',
      'BIN-ALT-01',
      'BIN-ALT-02'
    ],
    urgency: 'alta'
  },
  {
    id: 'TOP-04-INUNDACION',
    topCode: '4',
    label: 'Desbordes o inundaciones con arrastre contaminante',
    shortDescription:
      'Casos de desborde de río o inundación que arrastra contaminantes y afecta cultivos, viviendas, animales o salud.',
    municipalities: ['PUC', 'PP', 'DES'],
    signals: [
      'desborde',
      'inundación',
      'inundacion',
      'agua con olor',
      'espuma',
      'pérdida de cultivos',
      'perdida de cultivos',
      'animales enfermos'
    ],
    minimumEvidence: [
      { id: 'inu-e1', label: 'Lista de familias afectadas', required: true },
      { id: 'inu-e2', label: 'Fotos de daños', required: true },
      { id: 'inu-e3', label: 'Croquis o mapa del área afectada', required: true },
      { id: 'inu-e4', label: 'Fecha y hora del evento', required: true },
      { id: 'inu-e5', label: 'Costos aproximados o descripción de pérdidas', required: false }
    ],
    primaryRoute: [
      'Solicitar atención y evaluación inmediata de daños',
      'Pedir análisis de agua o suelo si hay sospecha de contaminación',
      'Requerir medidas preventivas para siguiente temporada'
    ],
    escalationRoute: [
      'Escalar a defensa civil, Gobernación y autoridad ambiental',
      'Exigir articulación con fuentes de contaminación aguas arriba'
    ],
    typicalAuthorities: [
      'GAM',
      'COEM/defensa civil',
      'Gobernación',
      'Autoridad ambiental'
    ],
    templateKeys: [
      'solicitud_inspeccion',
      'solicitud_informacion',
      'nota_seguimiento',
      'acta_comunitaria'
    ],
    normativeHintIds: [
      'BOL-RISK-01',
      'BOL-RISK-02',
      'BOL-CPE-01'
    ],
    urgency: 'alta'
  },
  {
    id: 'TOP-05-DERRAME',
    topCode: '5',
    label: 'Derrame de combustible, aceites u otros contaminantes',
    shortDescription:
      'Eventos agudos con mancha, olor a combustible o descarga puntual que requiere contención inmediata.',
    municipalities: ['DES', 'COP', 'HUA', 'PUC', 'PP'],
    signals: [
      'mancha iridiscente',
      'olor a combustible',
      'derrame',
      'aceite',
      'cisterna',
      'lancha'
    ],
    minimumEvidence: [
      { id: 'der-e1', label: 'Video o foto inmediata', required: true },
      { id: 'der-e2', label: 'Ubicación precisa', required: true },
      { id: 'der-e3', label: 'Hora exacta', required: true },
      { id: 'der-e4', label: 'Placa o identificación si existe', required: false },
      { id: 'der-e5', label: 'Testigos', required: true }
    ],
    primaryRoute: [
      'Emitir alerta rápida y exigir contención inmediata',
      'Solicitar evaluación del daño y limpieza',
      'Pedir informe público del incidente'
    ],
    escalationRoute: [
      'Escalar a autoridad ambiental y eventualmente Fiscalía',
      'Exigir reparación o restauración si hay inacción'
    ],
    typicalAuthorities: [
      'GAM',
      'Defensa civil',
      'Autoridad ambiental',
      'Fiscalía'
    ],
    templateKeys: [
      'solicitud_inspeccion',
      'solicitud_informacion',
      'nota_seguimiento'
    ],
    normativeHintIds: [
      'BOL-RISK-01',
      'BOL-RISK-02',
      'BOL-PEN-HEALTH-01',
      'BOL-ENV-PEN-01'
    ],
    urgency: 'alta'
  },
  {
    id: 'TOP-11-CONSULTA',
    topCode: '11',
    label: 'Consulta previa y participación en proyectos que afectan territorio o recursos',
    shortDescription:
      'Casos en que una obra, proyecto, concesión o decisión afecta territorio, recursos o comunidad sin consulta o participación suficiente.',
    municipalities: ['ALL'],
    signals: [
      'consulta',
      'ya decidieron',
      'socialización tardía',
      'socializacion tardia',
      'no entregan documentos',
      'afectación a territorio',
      'afectacion a territorio'
    ],
    minimumEvidence: [
      { id: 'con-e1', label: 'Prueba de existencia del proyecto o medida', required: true },
      { id: 'con-e2', label: 'Mapa o referencia del área afectada', required: true },
      { id: 'con-e3', label: 'Acta comunitaria o mandato', required: true },
      { id: 'con-e4', label: 'Solicitud previa sin respuesta, si existe', required: false }
    ],
    primaryRoute: [
      'Presentar solicitud formal de inicio de consulta o participación',
      'Pedir entrega completa de información del proyecto',
      'Levantar acta comunitaria con observaciones'
    ],
    escalationRoute: [
      'Impugnar omisiones ante autoridad competente',
      'Evaluar acción constitucional o colectiva si persiste la omisión'
    ],
    typicalAuthorities: [
      'Sector ejecutor',
      'GAM',
      'Gobernación',
      'Defensoría'
    ],
    templateKeys: [
      'solicitud_informacion',
      'nota_seguimiento',
      'acta_comunitaria'
    ],
    normativeHintIds: [
      'BOL-CPE-02',
      'BOL-CPE-04',
      'BOL-CPE-05',
      'INT-ESC-02',
      'INT-ILO-01',
      'INT-ILO-02',
      'INT-UNDRIP-02'
    ],
    urgency: 'alta'
  },
  {
    id: 'TOP-12-DEFENSORAS',
    topCode: '12',
    label: 'Amenazas u hostigamiento a defensoras ambientales',
    shortDescription:
      'Casos de amenazas, vigilancia, presión o represalias por denunciar contaminación, botaderos, obras ilegales u otros conflictos.',
    municipalities: ['ALL'],
    signals: [
      'amenaza',
      'amenazas',
      'hostigamiento',
      'represalia',
      'represalias',
      'difamación',
      'difamacion',
      'vigilancia'
    ],
    minimumEvidence: [
      { id: 'def-e1', label: 'Capturas de pantalla, audios o mensajes', required: true },
      { id: 'def-e2', label: 'Bitácora de incidentes', required: true },
      { id: 'def-e3', label: 'Testigos o personas de apoyo', required: false },
      { id: 'def-e4', label: 'Evaluación básica de riesgo', required: false }
    ],
    primaryRoute: [
      'Solicitar medidas de protección y registrar el incidente',
      'Presentar denuncia con resguardo de seguridad',
      'Activar red de apoyo y acompañamiento'
    ],
    escalationRoute: [
      'Escalar a Defensoría, Fiscalía o Policía si el riesgo persiste',
      'Considerar protocolo comunitario de seguridad'
    ],
    typicalAuthorities: [
      'Defensoría',
      'Fiscalía',
      'Policía'
    ],
    templateKeys: [
      'solicitud_informacion',
      'nota_seguimiento',
      'acta_comunitaria'
    ],
    normativeHintIds: [
      'INT-ESC-04',
      'BOL-WOM-03',
      'BOL-WOM-04'
    ],
    urgency: 'alta'
  }
];