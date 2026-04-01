<script lang="ts">
  import type { GeneratedDocument } from '$lib/documents/generateDocuments';
  import type { RefinedVariant } from '$lib/logic/refineDocuments';

  let {
    documents = [],
    selectedDocName = '',
    refinedVariants = [],
    selectedVariantKey = '',
    selectedLLMProvider = 'gemini',
    onSelectDocument,
    onSelectVariant,
    onExportVariant,
    onSelectLLMProvider,
    llmRefinedContent = '',
    llmRefinedLoading = false,
    llmRefinedError = '',
    llmRefinedProviderUsed = '',
    onRunLLMRefine,
    onExportLLMVariant
  }: {
    documents: GeneratedDocument[];
    selectedDocName: string;
    refinedVariants: RefinedVariant[];
    selectedVariantKey: string;
    selectedLLMProvider: string;
    onSelectDocument: (name: string) => void;
    onSelectVariant: (key: string) => void;
    onExportVariant: (key: string) => void;
    onSelectLLMProvider: (provider: string) => void;
    llmRefinedContent: string;
    llmRefinedLoading: boolean;
    llmRefinedError: string;
    llmRefinedProviderUsed: string;
    onRunLLMRefine: () => void;
    onExportLLMVariant: () => void;
  } = $props();

  let currentVariant = $derived(
    refinedVariants.find((item) => item.key === selectedVariantKey) ||
      refinedVariants[0] ||
      null
  );
</script>

<div>
  <h2>Refinamiento IA</h2>

  {#if documents.length === 0}
    <p>No hay documentos disponibles para refinar.</p>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
        <label>
          <strong>Documento base</strong><br />
          <select
            value={selectedDocName}
            onchange={(e) => onSelectDocument((e.currentTarget as HTMLSelectElement).value)}
            style="width: 100%; padding: 0.5rem;"
          >
            {#each documents as doc}
              <option value={doc.name}>{doc.name}</option>
            {/each}
          </select>
        </label>

        <label>
          <strong>Variante local</strong><br />
          <select
            value={selectedVariantKey}
            onchange={(e) => onSelectVariant((e.currentTarget as HTMLSelectElement).value)}
            style="width: 100%; padding: 0.5rem;"
          >
            {#each refinedVariants as variant}
              <option value={variant.key}>{variant.label}</option>
            {/each}
          </select>
        </label>

        <label>
          <strong>Proveedor LLM</strong><br />
          <select
            value={selectedLLMProvider}
            onchange={(e) => onSelectLLMProvider((e.currentTarget as HTMLSelectElement).value)}
            style="width: 100%; padding: 0.5rem;"
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
      </div>

      {#if currentVariant}
        <div
          style="
            border: 1px solid #ddd;
            border-radius: 0.5rem;
            padding: 0.75rem;
            background: #fafafa;
          "
        >
          <strong>Variante local seleccionada:</strong> {currentVariant.label}<br />
          <span style="font-size: 0.9rem; color: #666;">
            tono: {currentVariant.tone} | audiencia: {currentVariant.audience} | variante: {currentVariant.variant}
          </span>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button onclick={() => onExportVariant(currentVariant.key)}>
            Exportar variante local
          </button>
          <button onclick={onRunLLMRefine} disabled={llmRefinedLoading}>
            {llmRefinedLoading ? 'Refinando...' : 'Refinar con LLM real'}
          </button>
          <button onclick={onExportLLMVariant} disabled={!llmRefinedContent}>
            Exportar salida LLM
          </button>
        </div>

        <div>
          <h3 style="margin-bottom: 0.5rem;">Salida local</h3>
          <div
            style="
              white-space: pre-wrap;
              border: 1px solid #ccc;
              border-radius: 0.5rem;
              padding: 1rem;
              background: #fafafa;
              min-height: 260px;
            "
          >
            {currentVariant.content}
          </div>
        </div>

        <div style="margin-top: 1rem;">
          <h3 style="margin-bottom: 0.5rem;">Salida del backend LLM real</h3>

          <div
            style="
              border: 1px solid #ddd;
              border-radius: 0.5rem;
              padding: 0.75rem;
              background: #f8fafc;
              margin-bottom: 0.75rem;
            "
          >
            <strong>Proveedor solicitado:</strong> {selectedLLMProvider}<br />
            <strong>Proveedor que respondió:</strong> {llmRefinedProviderUsed || 'Sin respuesta todavía'}
          </div>

          {#if llmRefinedError}
            <div style="color: #b91c1c; margin-bottom: 1rem;">
              {llmRefinedError}
            </div>
          {/if}

          <div
            style="
              white-space: pre-wrap;
              border: 1px solid #ccc;
              border-radius: 0.5rem;
              padding: 1rem;
              background: #f8fafc;
              min-height: 260px;
            "
          >
            {llmRefinedContent || 'Todavía no se pidió refinamiento al backend.'}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>