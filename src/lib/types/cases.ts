import { getDb, CASES_STORE } from '$lib/db/client';
import type { CaseRecord } from '$lib/types/case';

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
  await db.put(CASES_STORE, caseData);
}

export async function deleteCase(caseId: string): Promise<void> {
  const db = await getDb();
  await db.delete(CASES_STORE, caseId);
}