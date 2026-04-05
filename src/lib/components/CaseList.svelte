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
  <h2 style="margin-top: 0; margin-bottom: 1rem; font-size: 2rem; font-weight: 800;">
    Casos
  </h2>

  {#if cases.length === 0}
    <div
      style="
        padding: 1rem;
        border: 1px solid #d9e2ec;
        border-radius: 14px;
        background: #f8fafc;
        color: #5f7286;
      "
    >
      No hay casos todavía.
    </div>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      {#each cases as caseItem}
        <div
          style={`
            border: 1px solid ${selectedCaseId === caseItem.id ? '#bfd3e6' : '#d9e2ec'};
            border-radius: 16px;
            padding: 1rem;
            background: ${selectedCaseId === caseItem.id ? '#eef4fb' : 'white'};
            box-shadow: 0 4px 12px rgba(15, 23, 32, 0.04);
            transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
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
              margin-bottom: 0.9rem;
              display: block;
            "
          >
            <div
              style="
                font-weight: 800;
                font-size: 1.05rem;
                color: #16293d;
                margin-bottom: 0.45rem;
                line-height: 1.3;
              "
            >
              {caseItem.title || 'Sin título'}
            </div>

            <div
              style="
                font-size: 0.96rem;
                color: #556677;
                line-height: 1.45;
              "
            >
              <div><strong>Comunidad:</strong> {caseItem.community || 'Pendiente'}</div>
              <div><strong>Estado:</strong> {caseItem.status || 'Pendiente'}</div>
              <div><strong>Eventos:</strong> {caseItem.events?.length || 0}</div>
            </div>
          </button>

          <div style="display: flex; justify-content: flex-end;">
            <button
              onclick={(e) => {
                e.stopPropagation();
                onDeleteCase(caseItem.id);
              }}
              style="
                background: #fff5f5;
                color: #b42318;
                border: 1px solid #f3b3b3;
                border-radius: 10px;
                padding: 0.5rem 0.85rem;
                font-weight: 700;
                font-size: 0.92rem;
                cursor: pointer;
              "
            >
              Borrar
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>