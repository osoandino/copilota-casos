import { supabase } from '$lib/supabase/client';
import type { CaseRecord } from '$lib/types/case';

export async function backupCaseToCloud(caseData: CaseRecord) {
  const now = new Date().toISOString();

  const payload = {
    id: caseData.id,
    title: caseData.title || null,
    community: caseData.community || null,
    updated_at: now,
    last_synced_at: now,
    case_payload: caseData
  };

  const { data, error } = await supabase
    .from('cases')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function restoreCaseFromCloud(caseId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('case_payload')
    .eq('id', caseId)
    .single();

  if (error) throw error;
  return data?.case_payload || null;
}

export async function listCloudBackups() {
  const { data, error } = await supabase
    .from('cases')
    .select('id, title, community, updated_at, last_synced_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteCaseFromCloud(caseId: string) {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId);

  if (error) throw error;
}