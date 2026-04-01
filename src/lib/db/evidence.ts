import { getDb, EVIDENCE_STORE } from '$lib/db/client';
import type { Evidence } from '$lib/types/case';

export async function getEvidenceByCaseId(caseId: string): Promise<Evidence[]> {
  const db = await getDb();
  const tx = db.transaction(EVIDENCE_STORE, 'readonly');
  const index = tx.store.index('caseId');
  const evidence = await index.getAll(caseId);

  return evidence as Evidence[];
}

export async function saveEvidence(evidenceData: Evidence): Promise<void> {
  const db = await getDb();
  await db.put(EVIDENCE_STORE, evidenceData);
}

export async function deleteEvidenceByCaseId(caseId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(EVIDENCE_STORE, 'readwrite');
  const index = tx.store.index('caseId');
  const keys = await index.getAllKeys(caseId);

  for (const key of keys) {
    await tx.store.delete(key);
  }

  await tx.done;
}