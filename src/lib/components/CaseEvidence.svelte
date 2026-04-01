<script lang="ts">
  import type { CaseRecord, Evidence } from '$lib/types/case';

  let {
    caseData,
    onAddEvidence,
    onUpdateEvidence,
    onDeleteEvidence,
    onUploadEvidenceFile
  }: {
    caseData: CaseRecord | null;
    onAddEvidence: () => void;
    onUpdateEvidence: (evidenceId: string, field: keyof Evidence, value: string) => void;
    onDeleteEvidence: (evidenceId: string) => void;
    onUploadEvidenceFile: (evidenceId: string, file: File) => void;
  } = $props();

  function handleFileChange(evidenceId: string, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    onUploadEvidenceFile(evidenceId, file);
  }
</script>

<div>
  <h2>Evidencia</h2>

  {#if !caseData}
    <p>Selecciona un caso.</p>
  {:else}
    <button onclick={onAddEvidence} style="margin-bottom: 1rem;">
      Añadir evidencia
    </button>

    {#if caseData.evidence.length === 0}
      <p>No hay evidencia registrada.</p>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        {#each caseData.evidence as item}
          <div
            style="
              border: 1px solid #ccc;
              border-radius: 0.5rem;
              padding: 1rem;
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            "
          >
            <label>
              <strong>Tipo</strong><br />
              <input
                value={item.type}
                oninput={(e) => onUpdateEvidence(item.id, 'type', (e.currentTarget as HTMLInputElement).value)}
                style="width: 100%; padding: 0.5rem;"
              />
            </label>

            <label>
              <strong>Nombre</strong><br />
              <input
                value={item.name}
                oninput={(e) => onUpdateEvidence(item.id, 'name', (e.currentTarget as HTMLInputElement).value)}
                style="width: 100%; padding: 0.5rem;"
              />
            </label>

            <label>
              <strong>Descripción</strong><br />
              <textarea
                rows="4"
                oninput={(e) => onUpdateEvidence(item.id, 'description', (e.currentTarget as HTMLTextAreaElement).value)}
                style="width: 100%; padding: 0.5rem;"
              >{item.description}</textarea>
            </label>

            <label>
              <strong>GPS o referencia</strong><br />
              <input
                value={item.gps}
                oninput={(e) => onUpdateEvidence(item.id, 'gps', (e.currentTarget as HTMLInputElement).value)}
                style="width: 100%; padding: 0.5rem;"
              />
            </label>

            <label>
              <strong>Fecha</strong><br />
              <input
                type="date"
                value={item.date}
                oninput={(e) => onUpdateEvidence(item.id, 'date', (e.currentTarget as HTMLInputElement).value)}
                style="width: 100%; padding: 0.5rem;"
              />
            </label>

            <label>
              <strong>Archivo</strong><br />
              <input
                type="file"
                onchange={(e) => handleFileChange(item.id, e)}
              />
            </label>

            <div>
              <strong>Nombre de archivo:</strong> {item.fileName || 'Sin archivo'}<br />
              <strong>Tipo MIME:</strong> {item.fileType || 'Sin tipo'}
            </div>

            {#if item.fileType && item.fileType.startsWith('image/') && item.fileData}
              <div>
                <strong>Vista previa</strong><br />
                <img
                  src={item.fileData}
                  alt={item.name || 'evidencia'}
                  style="max-width: 100%; max-height: 240px; border: 1px solid #ccc; border-radius: 0.5rem;"
                />
              </div>
            {/if}

            <div>
              <button
                onclick={() => onDeleteEvidence(item.id)}
                style="background: #dc2626; color: white; padding: 0.5rem 0.75rem; border: none; border-radius: 0.4rem;"
              >
                Eliminar evidencia
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>