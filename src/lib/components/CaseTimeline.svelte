<script lang="ts">
  import type { CaseRecord } from '$lib/types/case';

  let {
    caseData
  }: {
    caseData: CaseRecord | null;
  } = $props();
</script>

<div>
  <h2>Bitácora</h2>

  {#if !caseData}
    <p>Selecciona un caso.</p>
  {:else if caseData.events.length === 0}
    <p>No hay eventos registrados.</p>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      {#each caseData.events as eventItem}
        <div
          style="
            border: 1px solid #ccc;
            border-radius: 0.5rem;
            padding: 1rem;
            background: #fafafa;
          "
        >
          <div><strong>{eventItem.label}</strong></div>
          <div style="font-size: 0.9rem; color: #555; margin-top: 0.25rem;">
            {new Date(eventItem.createdAt).toLocaleString()}
          </div>

          {#if eventItem.notes}
            <div style="margin-top: 0.5rem;">
              {eventItem.notes}
            </div>
          {/if}

          <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;">
            Tipo: {eventItem.type}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>