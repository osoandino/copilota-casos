import { getDb, CASES_STORE } from '$lib/db/client';
import type { CaseRecord } from '$lib/types/case';
import { saveEvent, deleteEventsByCaseId } from '$lib/db/events';
import { saveEvidence, deleteEvidenceByCaseId } from '$lib/db/evidence';

export async function getAllCases(): Promise<CaseRecord[]> {
  const db = await getDb();
  const cases = await db.getAll(CASES_STORE);

  return (cases as CaseRecord[]).sort(
    (a, b) =>
      new Date(b.updatedAt || 0).getTime() -
      new Date(a.updatedAt || 0).getTime()
  );
}

export async function saveCase(caseData: CaseRecord): Promise<void> {
  const db = await getDb();

  const { evidence, events, ...caseOnly } = caseData;

  await db.put(CASES_STORE, caseOnly);

  await deleteEvidenceByCaseId(caseData.id);
  for (const item of evidence) {
    await saveEvidence({ ...item, caseId: caseData.id });
  }

  await deleteEventsByCaseId(caseData.id);
  for (const item of events) {
    await saveEvent({ ...item, caseId: caseData.id });
  }
}

export async function deleteCase(caseId: string): Promise<void> {
  const db = await getDb();
  await db.delete(CASES_STORE, caseId);

  await deleteEvidenceByCaseId(caseId);
  await deleteEventsByCaseId(caseId);
}