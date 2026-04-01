<script lang="ts">
  import type { CaseRecord } from '$lib/types/case';

  let {
    cases = [],
    selectedCaseId = '',
    onSelectCase,
    onDeleteCase
  }: {
    cases: CaseRecord[];
    selectedCaseId: string;
    onSelectCase: (caseId: string) => void;
    onDeleteCase: (caseId: string) => void;
  } = $props();
</script>

<div>
  <h2>Casos</h2>

  {#if cases.length === 0}
    <p>No hay casos todavía.</p>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      {#each cases as caseItem}
        <div
          style={`
            border: 1px solid #ccc;
            padding: 0.75rem;
            border-radius: 0.5rem;
            background: ${selectedCaseId === caseItem.id ? '#e5e7eb' : 'white'};
          `}
        >
          <button
            onclick={() => onSelectCase(caseItem.id)}
            style="
              width: 100%;
              text-align: left;
              background: transparent;
              border: none;
              padding: 0;
              cursor: pointer;
              margin-bottom: 0.75rem;
            "
          >
            <strong>{caseItem.title || 'Sin título'}</strong><br />
            Comunidad: {caseItem.community || 'Pendiente'}<br />
            Estado: {caseItem.status}<br />
            Eventos: {caseItem.events.length}
          </button>

          <div style="display: flex; justify-content: flex-end;">
            <button
              onclick={() => onDeleteCase(caseItem.id)}
              style="
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 0.4rem;
                padding: 0.45rem 0.7rem;
                cursor: pointer;
              "
            >
              Eliminar
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>