<script lang="ts">
  type SuggestedDocument = {
    name: string;
    why: string;
  };

  type GeneratedDocument = {
    name: string;
    content: string;
  };

  type RefinedVariant = {
    key: string;
    label: string;
    tone?: string;
    audience?: string;
    variant?: string;
    content: string;
  };

  let {
    suggestedDocuments,
    generatedDocuments,
    selectedDocumentName,
    onSelectDocument,
    onExportDocument,
    refinedVariants,
    selectedVariantKey,
    onSelectVariant,
    onExportVariant,
    selectedLLMProvider,
    onSelectLLMProvider,
    llmRefinedContent,
    llmRefinedLoading,
    llmRefinedError,
    llmRefinedProviderUsed,
    onRunLLMRefine,
    onExportLLMVariant
  }: {
    suggestedDocuments: SuggestedDocument[];
    generatedDocuments: GeneratedDocument[];
    selectedDocumentName: string;
    onSelectDocument: (name: string) => void;
    onExportDocument: (name: string) => void;
    refinedVariants: RefinedVariant[];
    selectedVariantKey: string;
    onSelectVariant: (key: string) => void;
    onExportVariant: (key: string) => void;
    selectedLLMProvider: string;
    onSelectLLMProvider: (provider: string) => void;
    llmRefinedContent: string;
    llmRefinedLoading: boolean;
    llmRefinedError: string;
    llmRefinedProviderUsed: string;
    onRunLLMRefine: () => void;
    onExportLLMVariant: () => void;
  } = $props();

  function selectedDocument() {
    return (
      generatedDocuments.find((doc) => doc.name === selectedDocumentName) ||
      generatedDocuments[0] ||
      null
    );
  }

  function selectedVariant() {
    return (
      refinedVariants.find((variant) => variant.key === selectedVariantKey) ||
      refinedVariants[0] ||
      null
    );
  }
</script>

<section
  id="documents-module"
  style="
    padding: 1rem 1.1rem;
    border: 1px solid #dbe6ef;
    border-radius: 18px;
    background: white;
  "
>
  <h2 style="margin-top: 0;">Documentos</h2>

  {#if suggestedDocuments && suggestedDocuments.length > 0}
    <div
      style="
        margin-bottom: 1rem;
        padding: 1rem;
        border: 1px solid #e2ebf3;
        border-radius: 16px;
        background: #f8fbff;
      "
    >
      <div style="font-weight: 700; margin-bottom: 0.5rem;">Documentos recomendados</div>
      <div style="display: grid; gap: 0.45rem;">
        {#each suggestedDocuments as doc}
          <div style="color: #526273; line-height: 1.5;">
            <strong>{doc.name}</strong> — {doc.why}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div
    style="
      display: grid;
      grid-template-columns: minmax(220px, 300px) 1fr;
      gap: 1rem;
    "
  >
    <div
      style="
        padding: 1rem;
        border: 1px solid #e2ebf3;
        border-radius: 16px;
        background: #fbfdff;
      "
    >
      <div style="font-weight: 700; margin-bottom: 0.7rem;">Documentos generados</div>

      <div style="display: grid; gap: 0.5rem;">
        {#each generatedDocuments as doc}
          <button
            onclick={() => onSelectDocument(doc.name)}
            style={`
              text-align: left;
              padding: 0.75rem 0.85rem;
              border-radius: 12px;
              border: 1px solid #d8e2ec;
              cursor: pointer;
              background: ${selectedDocumentName === doc.name ? '#eaf2fb' : 'white'};
              font-weight: ${selectedDocumentName === doc.name ? '700' : '600'};
            `}
          >
            {doc.name}
          </button>
        {/each}
      </div>
    </div>

    <div
      style="
        padding: 1rem;
        border: 1px solid #e2ebf3;
        border-radius: 16px;
        background: white;
      "
    >
      {#if selectedDocument()}
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
          <div>
            <div style="font-size: 0.92rem; color: #607386;">Documento base</div>
            <div style="font-weight: 800; font-size: 1.1rem;">{selectedDocument()?.name}</div>
          </div>

          <button
            onclick={() => {
              const doc = selectedDocument();
              if (doc) onExportDocument(doc.name);
            }}
            style="
              padding: 0.65rem 0.9rem;
              border-radius: 10px;
              border: 1px solid #cfd8e3;
              background: white;
              cursor: pointer;
            "
          >
            Exportar
          </button>
        </div>

        <pre
          style="
            margin-top: 1rem;
            padding: 1rem;
            white-space: pre-wrap;
            line-height: 1.55;
            font-family: inherit;
            background: #f8fafc;
            border: 1px solid #e5ebf2;
            border-radius: 14px;
            color: #243445;
          "
        >{selectedDocument()?.content}</pre>
      {:else}
        <div style="color: #5f7286;">No hay documento seleccionado.</div>
      {/if}
    </div>
  </div>

  <div
    style="
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid #e2ebf3;
      border-radius: 16px;
      background: #fbfdff;
    "
  >
    <div style="font-weight: 700; margin-bottom: 0.7rem;">Variantes sugeridas</div>

    <div style="display: flex; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 0.9rem;">
      {#each refinedVariants as variant}
        <button
          onclick={() => onSelectVariant(variant.key)}
          style={`
            padding: 0.65rem 0.85rem;
            border-radius: 10px;
            border: 1px solid #d7e1eb;
            cursor: pointer;
            background: ${selectedVariantKey === variant.key ? '#eaf2fb' : 'white'};
            font-weight: ${selectedVariantKey === variant.key ? '700' : '600'};
          `}
        >
          {variant.label}
        </button>
      {/each}
    </div>

    {#if selectedVariant()}
      <div style="display: flex; justify-content: flex-end; margin-bottom: 0.7rem;">
        <button
          onclick={() => {
            const variant = selectedVariant();
            if (variant) onExportVariant(variant.key);
          }}
          style="
            padding: 0.6rem 0.85rem;
            border-radius: 10px;
            border: 1px solid #cfd8e3;
            background: white;
            cursor: pointer;
          "
        >
          Exportar variante
        </button>
      </div>

      <pre
        style="
          margin: 0;
          padding: 1rem;
          white-space: pre-wrap;
          line-height: 1.55;
          font-family: inherit;
          background: white;
          border: 1px solid #e5ebf2;
          border-radius: 14px;
          color: #243445;
        "
      >{selectedVariant()?.content}</pre>
    {/if}
  </div>

  <div
    style="
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid #dbe6ef;
      border-radius: 16px;
      background: #f8fbff;
    "
  >
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <div>
        <div style="font-weight: 800;">Refinamiento IA</div>
        <div style="color: #607386; margin-top: 0.25rem;">
          Mejora el documento seleccionado con apoyo de IA y la base normativa asignada.
        </div>
      </div>

      <div style="display: flex; gap: 0.6rem; align-items: center;">
        <select
          value={selectedLLMProvider}
          onchange={(e) => onSelectLLMProvider((e.currentTarget as HTMLSelectElement).value)}
          style="padding: 0.55rem 0.7rem; border-radius: 10px; border: 1px solid #cfd8e3;"
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
        </select>

        <button
          onclick={onRunLLMRefine}
          disabled={llmRefinedLoading}
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
          {llmRefinedLoading ? 'Refinando…' : 'Refinar con IA'}
        </button>
      </div>
    </div>

    {#if llmRefinedError}
      <div style="margin-top: 0.8rem; color: #a12d2d;">{llmRefinedError}</div>
    {/if}

    {#if llmRefinedContent}
      <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
        <button
          onclick={onExportLLMVariant}
          style="
            padding: 0.6rem 0.85rem;
            border-radius: 10px;
            border: 1px solid #cfd8e3;
            background: white;
            cursor: pointer;
          "
        >
          Exportar versión IA
        </button>
      </div>

      <div
        style="
          margin-top: 0.8rem;
          padding: 1rem;
          border: 1px solid #e2ebf3;
          border-radius: 14px;
          background: white;
        "
      >
        <div style="margin-bottom: 0.5rem; color: #607386;">
          Resultado refinado
          {#if llmRefinedProviderUsed}
            <strong>({llmRefinedProviderUsed})</strong>
          {/if}
        </div>

        <pre
          style="
            margin: 0;
            white-space: pre-wrap;
            line-height: 1.6;
            font-family: inherit;
            color: #243445;
          "
        >{llmRefinedContent}</pre>
      </div>
    {/if}
  </div>
</section>