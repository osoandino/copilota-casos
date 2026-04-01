import { getDb, EVENTS_STORE } from '$lib/db/client';
import type { CaseEvent } from '$lib/types/case';

export async function getEventsByCaseId(caseId: string): Promise<CaseEvent[]> {
  const db = await getDb();
  const tx = db.transaction(EVENTS_STORE, 'readonly');
  const index = tx.store.index('caseId');
  const events = await index.getAll(caseId);

  return (events as CaseEvent[]).sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
}

export async function saveEvent(eventData: CaseEvent): Promise<void> {
  const db = await getDb();
  await db.put(EVENTS_STORE, eventData);
}

export async function deleteEventsByCaseId(caseId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(EVENTS_STORE, 'readwrite');
  const index = tx.store.index('caseId');
  const keys = await index.getAllKeys(caseId);

  for (const key of keys) {
    await tx.store.delete(key);
  }

  await tx.done;
}