export type UrgencyLevel = 'alta' | 'media' | 'baja';

export type EvidenceNeed = {
  id: string;
  label: string;
  required: boolean;
  description?: string;
};

export type ActionPattern = {
  id: string;
  topCode: string;
  label: string;
  shortDescription?: string;
  description?: string;
  municipalities: string[];
  signals: string[];
  typicalAuthorities: string[];
  templateKeys: string[];
  primaryRoute: string[];
  escalationRoute: string[];
  minimumEvidence: EvidenceNeed[];
  urgency: UrgencyLevel;
  normativeHintIds?: string[];
  notes?: string;
};

export type OperationalCandidate = {
  id: string;
  topCode: string;
  label: string;
  shortDescription?: string;
  score: number;
  matchedSignals: string[];
  typicalAuthorities: string[];
  templateKeys: string[];
  primaryRoute: string[];
  escalationRoute: string[];
  minimumEvidence: EvidenceNeed[];
  urgency: UrgencyLevel;
};

export type OperationalCaseAnalysis = {
  caseId: string;
  probableActionPatternIds: string[];
  matchedSignals: string[];
  likelyAuthorities: string[];
  recommendedTemplates: string[];
  primaryActions: string[];
  escalationActions: string[];
  expectedEvidence: string[];
  urgency: UrgencyLevel;
  notes: string[];
};

export type OperationalAnalysis = {
  analysis: OperationalCaseAnalysis;
  primaryCandidate: OperationalCandidate | null;
  secondaryCandidates: OperationalCandidate[];
};