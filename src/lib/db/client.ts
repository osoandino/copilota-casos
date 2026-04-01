import { openDB } from 'idb';

export const DB_NAME = 'copilota-casos-db';
export const DB_VERSION = 1;

export const CASES_STORE = 'cases';
export const EVIDENCE_STORE = 'evidence';
export const EVENTS_STORE = 'events';

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CASES_STORE)) {
        db.createObjectStore(CASES_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(EVIDENCE_STORE)) {
        const evidenceStore = db.createObjectStore(EVIDENCE_STORE, { keyPath: 'id' });
        evidenceStore.createIndex('caseId', 'caseId');
      }

      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const eventsStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
        eventsStore.createIndex('caseId', 'caseId');
      }
    }
  });
}