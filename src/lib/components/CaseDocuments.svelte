<script lang="ts">
  import type { GeneratedDocument } from '$lib/documents/generateDocuments';

  let {
    documents = [],
    selectedDocName = '',
    onSelectDocument,
    onExportDocument
  }: {
    documents: GeneratedDocument[];
    selectedDocName: string;
    onSelectDocument: (name: string) => void;
    onExportDocument: (name: string) => void;
  } = $props();

  let currentDocument = $derived(
    documents.find((doc) => doc.name === selectedDocName) || documents[0] || null
  );
</script>

<div>
  <h2>Documentos</h2>

  {#if documents.length === 0}
    <p>No hay documentos generados.</p>
  {:else}
    <div style="display: grid; grid-template-columns: 260px 1fr; gap: 1rem; align-items: start;">
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        {#each documents as doc}
          <button
            onclick={() => onSelectDocument(doc.name)}
            style={`
              text-align: left;
              border: 1px solid #ccc;
              padding: 0.75rem;
              border-radius: 0.5rem;
              background: ${selectedDocName === doc.name ? '#e5e7eb' : 'white'};
              cursor: pointer;
            `}
          >
            {doc.name}
          </button>
        {/each}
      </div>

      <div>
        {#if currentDocument}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: 1rem;">
            <h3 style="margin: 0;">{currentDocument.name}</h3>
            <button onclick={() => onExportDocument(currentDocument.name)}>
              Exportar .txt
            </button>
          </div>

          <div
            style="
              white-space: pre-wrap;
              border: 1px solid #ccc;
              border-radius: 0.5rem;
              padding: 1rem;
              background: #fafafa;
              min-height: 360px;
            "
          >
            {currentDocument.content}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>