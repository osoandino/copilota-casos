<script lang="ts">
  type EvidenceItem = {
    id: string;
    type?: string;
    name?: string;
    description?: string;
    whatItShows?: string;
    gps?: string;
    date?: string;
    fileName?: string;
    fileType?: string;
    fileData?: string;
  };

  type CaseData = {
    evidence?: EvidenceItem[];
  } | null;

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
    caseData,
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
    caseData: CaseData;
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

  const evidenceTypeOrder = [
    'Documento oficial',
    'Informe técnico',
    'Muestra / análisis',
    'Acta',
    'Documento comunitario',
    'Mapa / croquis',
    'Registro GPS',
    'Fotografía',
    'Video',
    'Audio',
    'Testimonio',
    'Otro'
  ] as const;

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

  function recommendedDocumentNames() {
    return new Set([
      'Ficha resumen del caso',
      ...suggestedDocuments.map((doc) => doc.name)
    ]);
  }

  function recommendedGeneratedDocuments() {
    const names = recommendedDocumentNames();
    return generatedDocuments.filter((doc) => names.has(doc.name));
  }

  function additionalGeneratedDocuments() {
    const names = recommendedDocumentNames();
    return generatedDocuments.filter((doc) => !names.has(doc.name));
  }

  function isEvidencePackageSelected(docName?: string) {
    const normalized = (docName || '').toLowerCase();
    return normalized.includes('paquete') && normalized.includes('evidencia');
  }

  function assessEvidenceItem(e: EvidenceItem) {
    const missing: string[] = [];

    if (!(e.type || e.name)) {
      missing.push('tipo o nombre de referencia');
    }

    if (!e.description) {
      missing.push('descripción');
    }

    if (!e.whatItShows) {
      missing.push('qué demuestra');
    }

    if (!(e.date || e.gps || e.fileName)) {
      missing.push('fecha, GPS o archivo de respaldo');
    }

    let status: 'sólida' | 'parcial' | 'débil' = 'sólida';
    if (missing.length === 1) status = 'parcial';
    if (missing.length >= 2) status = 'débil';

    return { missing, status };
  }

  function normalizeEvidenceType(type?: string): string {
    const t = (type || '').toLowerCase().trim();

    if (!t) return 'Otro';
    if (t.includes('foto')) return 'Fotografía';
    if (t.includes('video')) return 'Video';
    if (t.includes('audio')) return 'Audio';
    if (t.includes('testimonio')) return 'Testimonio';
    if (t.includes('documento oficial')) return 'Documento oficial';
    if (t.includes('documento comunitario')) return 'Documento comunitario';
    if (t.includes('acta')) return 'Acta';
    if (t.includes('mapa') || t.includes('croquis')) return 'Mapa / croquis';
    if (t.includes('gps')) return 'Registro GPS';
    if (t.includes('informe')) return 'Informe técnico';
    if (t.includes('muestra') || t.includes('análisis') || t.includes('analisis')) {
      return 'Muestra / análisis';
    }

    return 'Otro';
  }

  function packageSummary() {
    const evidence = caseData?.evidence || [];
    const assessed = evidence.map((e) => assessEvidenceItem(e));

    const gapCounter = new Map<string, number>();
    assessed.forEach((item) => {
      item.missing.forEach((gap) => {
        gapCounter.set(gap, (gapCounter.get(gap) || 0) + 1);
      });
    });

    const grouped = new Map<string, number>();
    evidence.forEach((e) => {
      const label = normalizeEvidenceType(e.type);
      grouped.set(label, (grouped.get(label) || 0) + 1);
    });

    const orderedCategories = [
      ...evidenceTypeOrder.filter((label) => grouped.has(label)),
      ...[...grouped.keys()]
        .filter((label) => !evidenceTypeOrder.includes(label as (typeof evidenceTypeOrder)[number]))
        .sort()
    ].map((label) => ({
      label,
      count: grouped.get(label) || 0
    }));

    return {
      total: evidence.length,
      solid: assessed.filter((a) => a.status === 'sólida').length,
      partial: assessed.filter((a) => a.status === 'parcial').length,
      weak: assessed.filter((a) => a.status === 'débil').length,
      commonGaps: [...gapCounter.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([gap, count]) => `${gap} (${count})`),
      categories: orderedCategories
    };
  }

  function packageReadiness() {
    const summary = packageSummary();

    if (summary.total === 0) {
      return {
        level: 'débil' as const,
        title: 'Paquete todavía sin base de evidencia',
        message:
          'Aún no hay evidencias registradas. Exportar ahora el paquete produciría un respaldo muy débil.'
      };
    }

    if (summary.solid === summary.total) {
      return {
        level: 'lista' as const,
        title: 'Paquete razonablemente listo',
        message:
          'La evidencia registrada tiene una base útil de completitud para una presentación más sólida.'
      };
    }

    if (summary.solid >= Math.ceil(summary.total / 2)) {
      return {
        level: 'intermedia' as const,
        title: 'Paquete usable, pero reforzable',
        message:
          'Ya existe una base de evidencia útil, pero varias piezas todavía necesitan mayor precisión.'
      };
    }

    return {
      level: 'débil' as const,
      title: 'Paquete todavía débil',
      message:
        'La mayor parte de la evidencia sigue siendo parcial o débil. Conviene completar vacíos antes de exportar.'
      };
  }

  function readinessStyles(level: 'lista' | 'intermedia' | 'débil') {
    if (level === 'lista') {
      return {
        background: '#edf8f0',
        border: '#b9e1c1',
        color: '#1f6b35'
      };
    }

    if (level === 'intermedia') {
      return {
        background: '#fff8e9',
        border: '#efd99a',
        color: '#8a6412'
      };
    }

    return {
      background: '#fdeeee',
      border: '#e8b8b8',
      color: '#9a2f2f'
    };
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

      <div style="font-size: 0.92rem; font-weight: 700; color: #5f7286; margin-bottom: 0.55rem;">
        Recomendados para este caso
      </div>

      <div style="display: grid; gap: 0.5rem;">
        {#each recommendedGeneratedDocuments() as doc}
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

      {#if additionalGeneratedDocuments().length > 0}
        <div
          style="
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e1e8f0;
          "
        >
          <div style="font-size: 0.92rem; font-weight: 700; color: #5f7286; margin-bottom: 0.55rem;">
            Otras plantillas disponibles
          </div>

          <div style="display: grid; gap: 0.5rem;">
            {#each additionalGeneratedDocuments() as doc}
              <button
                onclick={() => onSelectDocument(doc.name)}
                style={`
                  text-align: left;
                  padding: 0.75rem 0.85rem;
                  border-radius: 12px;
                  border: 1px solid #d8e2ec;
                  cursor: pointer;
                  background: ${selectedDocumentName === doc.name ? '#eaf2fb' : 'white'};
                  font-weight: ${selectedDocumentName === doc.name ? '700' : '500'};
                  color: ${selectedDocumentName === doc.name ? '#16293d' : '#4f6273'};
                `}
              >
                {doc.name}
              </button>
            {/each}
          </div>
        </div>
      {/if}
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
        {#if isEvidencePackageSelected(selectedDocument()?.name)}
          <div
            style={`
              margin-bottom: 1rem;
              padding: 1rem;
              border: 1px solid ${readinessStyles(packageReadiness().level).border};
              border-radius: 14px;
              background: ${readinessStyles(packageReadiness().level).background};
              color: ${readinessStyles(packageReadiness().level).color};
            `}
          >
            <div style="font-weight: 800; margin-bottom: 0.45rem;">
              {packageReadiness().title}
            </div>
            <div style="line-height: 1.55; margin-bottom: 0.7rem;">
              {packageReadiness().message}
            </div>

            <div
              style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: 0.55rem;
                line-height: 1.5;
              "
            >
              <div><strong>Total:</strong> {packageSummary().total}</div>
              <div><strong>Sólidas:</strong> {packageSummary().solid}</div>
              <div><strong>Parciales:</strong> {packageSummary().partial}</div>
              <div><strong>Débiles:</strong> {packageSummary().weak}</div>
            </div>

            {#if packageSummary().commonGaps.length > 0}
              <div style="margin-top: 0.8rem; line-height: 1.5;">
                <strong>Vacíos más frecuentes:</strong>
                <div style="margin-top: 0.25rem;">
                  {packageSummary().commonGaps.join(' · ')}
                </div>
              </div>
            {/if}

            {#if packageSummary().categories.length > 0}
              <div style="margin-top: 0.8rem; line-height: 1.5;">
                <strong>Distribución por tipo de evidencia:</strong>
                <div
                  style="
                    margin-top: 0.45rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.45rem 0.55rem;
                  "
                >
                  {#each packageSummary().categories as category}
                    <span
                      style="
                        padding: 0.35rem 0.6rem;
                        border-radius: 999px;
                        background: rgba(255,255,255,0.55);
                        border: 1px solid rgba(0,0,0,0.08);
                        font-size: 0.92rem;
                      "
                    >
                      {category.label}: {category.count}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}

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