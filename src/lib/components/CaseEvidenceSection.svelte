<script lang="ts">
  type EvidenceItem = {
    id: string;
    type?: string;
    name?: string;
    description?: string;
    gps?: string;
    date?: string;
    fileName?: string;
    fileType?: string;
    fileData?: string;
  };

  type CaseData = {
    evidence?: EvidenceItem[];
  } | null;

  let {
    caseData,
    onAddEvidence,
    onUpdateEvidence,
    onDeleteEvidence,
    onUploadEvidenceFile
  }: {
    caseData: CaseData;
    onAddEvidence: () => void;
    onUpdateEvidence: (evidenceId: string, field: string, value: string) => void;
    onDeleteEvidence: (evidenceId: string) => void;
    onUploadEvidenceFile: (evidenceId: string, file: File) => void;
  } = $props();
</script>

<section
  style="
    padding: 1rem 1.1rem;
    border: 1px solid #dbe6ef;
    border-radius: 18px;
    background: white;
  "
>
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
    <h2 style="margin: 0;">Evidencia</h2>
    <button
      onclick={onAddEvidence}
      style="
        padding: 0.7rem 1rem;
        border-radius: 12px;
        border: none;
        background: #1f5fae;
        color: white;
        font-weight: 700;
        cursor: pointer;
      "
    >
      Añadir evidencia
    </button>
  </div>

  <div style="display: grid; gap: 1rem; margin-top: 1rem;">
    {#if !caseData?.evidence || caseData.evidence.length === 0}
      <div style="color: #5f7286;">Aún no se registró evidencia.</div>
    {:else}
      {#each caseData.evidence as evidence}
        <div
          style="
            padding: 1rem;
            border: 1px solid #e1e8f0;
            border-radius: 16px;
            background: #fbfdff;
          "
        >
          <div
            style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 0.8rem;
            "
          >
            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">Tipo</div>
              <input
                value={evidence.type || ''}
                oninput={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'type',
                    (e.currentTarget as HTMLInputElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px;"
              />
            </label>

            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">Nombre</div>
              <input
                value={evidence.name || ''}
                oninput={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'name',
                    (e.currentTarget as HTMLInputElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px;"
              />
            </label>

            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">Fecha</div>
              <input
                value={evidence.date || ''}
                oninput={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'date',
                    (e.currentTarget as HTMLInputElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px;"
              />
            </label>

            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">GPS</div>
              <input
                value={evidence.gps || ''}
                oninput={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'gps',
                    (e.currentTarget as HTMLInputElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px;"
              />
            </label>
          </div>

          <label style="display: block; margin-top: 0.8rem;">
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Descripción</div>
            <textarea
              rows="3"
              oninput={(e) =>
                onUpdateEvidence(
                  evidence.id,
                  'description',
                  (e.currentTarget as HTMLTextAreaElement).value
                )}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            >{evidence.description || ''}</textarea>
          </label>

          <div style="margin-top: 0.8rem; display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: center;">
            <input
              type="file"
              onchange={(e) => {
                const input = e.currentTarget as HTMLInputElement;
                const file = input.files?.[0];
                if (file) onUploadEvidenceFile(evidence.id, file);
              }}
            />

            {#if evidence.fileName}
              <span style="color: #5a6b7b; font-size: 0.95rem;">
                Archivo: {evidence.fileName}
              </span>
            {/if}

            <button
              onclick={() => onDeleteEvidence(evidence.id)}
              style="
                padding: 0.55rem 0.8rem;
                border: 1px solid #e2b8b8;
                background: white;
                color: #9a2f2f;
                border-radius: 10px;
                cursor: pointer;
              "
            >
              Eliminar evidencia
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</section>