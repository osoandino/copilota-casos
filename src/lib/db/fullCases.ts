import { getAllCases } from '$lib/db/cases';
import { getEvidenceByCaseId } from '$lib/db/evidence';
import { getEventsByCaseId } from '$lib/db/events';
import type { CaseRecord } from '$lib/types/case';

export async function getAllCasesWithRelations(): Promise<CaseRecord[]> {
  const cases = await getAllCases();

  return Promise.all(
    cases.map(async (caseItem) => {
      const evidence = await getEvidenceByCaseId(caseItem.id);
      const events = await getEventsByCaseId(caseItem.id);

      return {
        ...caseItem,
        evidence,
        events
      };
    })
  );
}