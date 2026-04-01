import type { CaseRecord } from '$lib/types/case';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createEmptyCase(): CaseRecord {
  const id = uid();
  const now = new Date().toISOString();

  return {
    id,
    title: '',
    reporter: '',
    narrative: '',
    community: '',
    location: '',
    dateStarted: '',
    affectedPeople: '',
    problemType: '',
    authorityContacted: '',
    authorityResponse: '',
    status: 'Borrador',
    createdAt: now,
    updatedAt: now,
    evidence: [],
    events: [
      {
        id: uid(),
        caseId: id,
        type: 'case_created',
        label: 'Caso creado',
        notes: 'Se creó el expediente.',
        createdAt: now
      }
    ],
    normativeMatches: []
  };
}