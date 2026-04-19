import type { CaseNormativeMatch } from '$lib/types/normative';

export type CaseEvent = {
  id: string;
  caseId: string;
  type: string;
  label: string;
  notes: string;
  createdAt: string;
};

export type Evidence = {
  id: string;
  caseId: string;
  type: string;
  name: string;
  description: string;
  gps: string;
  date: string;
  fileName: string;
  fileType: string;
  fileData: string;
  whatItShows?: string;
};

export type CaseRecord = {
  id: string;
  title: string;
  reporter: string;
  narrative: string;
  community: string;
  location: string;
  dateStarted: string;
  affectedPeople: string;
  problemType: string;
  authorityContacted: string;
  authorityResponse: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  evidence: Evidence[];
  events: CaseEvent[];
  normativeMatches: CaseNormativeMatch[];
};