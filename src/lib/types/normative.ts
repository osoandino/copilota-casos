export type DocumentUseKey =
  | 'ficha_resumen'
  | 'solicitud_inspeccion'
  | 'solicitud_informacion'
  | 'nota_seguimiento'
  | 'acta_comunitaria'
  | 'cronologia'
  | 'presentacion_alt'
  | 'presentacion_defensoria';

export type NormativeSource = {
  id: string;
  country: string;
  jurisdictionLevel: string;
  normType: string;
  normTitle: string;
  article: string;
  excerpt: string;
  officialSource: string;
  validityStatus: string;
  lastReviewed: string;
  themeTags: string[];
  rightsTags: string[];
  institutionTags: string[];
  procedureTags: string[];
  territorialTags: string[];
  documentUseTags: string[];
  notes?: string;
};

export type CaseNormativeAnalysis = {
  summary: string;
  urgencyLevel: 'alta' | 'media' | 'baja';
  detectedThemes: string[];
  possibleRights: string[];
  possibleInstitutions: string[];
  possibleProcedures: string[];
  retrievalKeywords: string[];
};

export type CaseNormativeMatch = {
  id: string;
  caseId: string;
  normativeSourceId: string;
  relevance: 'alta' | 'media' | 'baja';
  functionInCase: string;
  rationale: string;
  triggeringFact: string;
  missingForStrongerUse: string;
  caution: string;
  selectedForUse: boolean;
  selectedForDocuments: DocumentUseKey[];
};