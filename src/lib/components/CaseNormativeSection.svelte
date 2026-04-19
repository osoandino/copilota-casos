<script lang="ts">
  import type { DocumentUseKey } from '$lib/types/normative';
  import { documentRegistry } from '$lib/config/documentRegistry';

  type NormativeAnalysis = {
    summary?: string;
    urgencyLevel?: string;
    detectedThemes?: string[];
    possibleRights?: string[];
    possibleInstitutions?: string[];
    possibleProcedures?: string[];
    retrievalKeywords?: string[];
  } | null;

  type CandidateNorm = {
    id: string;
    normTitle: string;
    article?: string;
    excerpt?: string;
    themeTags?: string[];
    rightsTags?: string[];
    institutionTags?: string[];
    documentUseTags?: string[];
  };

  type NormativeMatch = {
    normativeSourceId: string;
    relevance?: string;
    functionInCase?: string;
    rationale?: string;
    triggeringFact?: string;
    missingForStrongerUse?: string;
    caution?: string;
    selectedForUse?: boolean;
    selectedForDocuments?: DocumentUseKey[];
  };

  let {
    normativeAnalysis,
    candidateNorms,
    normativeMatches,
    normativeEvaluationLoading,
    normativeEvaluationError,
    normativeEvaluationProviderUsed,
    selectedLLMProvider,
    onSelectLLMProvider,
    onRunNormativeEvaluation,
    onToggleNormativeSelection,
    onToggleNormativeDocumentUse
  }: {
    normativeAnalysis: NormativeAnalysis;
    candidateNorms: CandidateNorm[];
    normativeMatches: NormativeMatch[];
    normativeEvaluationLoading: boolean;
    normativeEvaluationError: string;
    normativeEvaluationProviderUsed: string;
    selectedLLMProvider: string;
    onSelectLLMProvider: (provider: string) => void;
    onRunNormativeEvaluation: () => void;
    onToggleNormativeSelection: (normativeSourceId: string, selected: boolean) => void;
    onToggleNormativeDocumentUse: (
      normativeSourceId: string,
      documentUse: DocumentUseKey,
      selected: boolean
    ) => void;
  } = $props();

  const documentUseOptions: { key: DocumentUseKey; label: string }[] =
    documentRegistry.map((item) => ({
      key: item.key,
      label: item.name
    }));

  function getNormativeMatch(normId: string) {
    return normativeMatches.find((m) => m.normativeSourceId === normId);
  }

  function isNormSelectedForDocument(normId: string, key: DocumentUseKey) {
    const match = getNormativeMatch(normId);
    return !!match?.selectedForDocuments?.includes(key);
  }

  function prettyList(values?: string[]) {
    return values && values.length > 0 ? values.join(' · ') : '—';
  }

  function safe<T>(value: T | undefined | null, fallback = '—') {
    return value ? String(value) : fallback;
  }
</script>

<section
  id="normative-module"
  style="
    padding: 1rem 1.1rem;
    border: 1px solid #dbe6ef;
    border-radius: 18px;
    background: white;
  "
>
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
    <h2 style="margin: 0;">Marco normativo</h2>
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
        onclick={onRunNormativeEvaluation}
        disabled={normativeEvaluationLoading}
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
        {normativeEvaluationLoading ? 'Valorando…' : 'Valorar normas con IA'}
      </button>
    </div>
  </div>

  {#if normativeAnalysis}
    <div
      style="
        margin-top: 1rem;
        padding: 1rem;
        border: 1px solid #e2ebf3;
        border-radius: 16px;
        background: #f8fbff;
      "
    >
      <div style="font-weight: 700; margin-bottom: 0.45rem;">Lectura normativa preliminar</div>
      <div style="line-height: 1.6; color: #4f6072;">
        <div><strong>Resumen:</strong> {safe(normativeAnalysis.summary)}</div>
        <div><strong>Urgencia:</strong> {safe(normativeAnalysis.urgencyLevel)}</div>
        <div><strong>Temas detectados:</strong> {prettyList(normativeAnalysis.detectedThemes)}</div>
        <div><strong>Posibles derechos:</strong> {prettyList(normativeAnalysis.possibleRights)}</div>
        <div><strong>Instituciones:</strong> {prettyList(normativeAnalysis.possibleInstitutions)}</div>
        <div><strong>Procedimientos:</strong> {prettyList(normativeAnalysis.possibleProcedures)}</div>
        <div><strong>Palabras clave:</strong> {prettyList(normativeAnalysis.retrievalKeywords)}</div>
      </div>
    </div>
  {/if}

  {#if normativeEvaluationError}
    <div style="margin-top: 0.8rem; color: #a12d2d;">
      {normativeEvaluationError}
    </div>
  {/if}

  {#if normativeEvaluationProviderUsed}
    <div style="margin-top: 0.8rem; color: #617486; font-size: 0.95rem;">
      Valoración asistida con: {normativeEvaluationProviderUsed}
    </div>
  {/if}

  <div style="display: grid; gap: 1rem; margin-top: 1rem;">
    {#each candidateNorms as norm}
      <div
        style="
          padding: 1rem;
          border: 1px solid #dfe8f0;
          border-radius: 16px;
          background: #fbfdff;
        "
      >
        <div style="font-weight: 800; color: #16293d;">
          {norm.normTitle}
        </div>
        <div style="margin-top: 0.2rem; color: #5d6f80;">
          {safe(norm.article)}
        </div>

        {#if norm.excerpt}
          <div style="margin-top: 0.7rem; line-height: 1.55; color: #4f6072;">
            {norm.excerpt}
          </div>
        {/if}

        <div style="margin-top: 0.7rem; color: #607386; font-size: 0.94rem;">
          <strong>Etiquetas:</strong> {prettyList(norm.themeTags)}
        </div>

        {#if getNormativeMatch(norm.id)}
          <div
            style="
              margin-top: 0.9rem;
              padding: 0.9rem;
              border-radius: 14px;
              background: #f4f8fc;
              border: 1px solid #e2ebf3;
              line-height: 1.55;
              color: #4f6273;
            "
          >
            <div><strong>Relevancia:</strong> {safe(getNormativeMatch(norm.id)?.relevance)}</div>
            <div><strong>Función en el caso:</strong> {safe(getNormativeMatch(norm.id)?.functionInCase)}</div>
            <div><strong>Razón de pertinencia:</strong> {safe(getNormativeMatch(norm.id)?.rationale)}</div>
            <div><strong>Hecho activador:</strong> {safe(getNormativeMatch(norm.id)?.triggeringFact)}</div>
            <div><strong>Qué falta:</strong> {safe(getNormativeMatch(norm.id)?.missingForStrongerUse)}</div>
            <div><strong>Cautela:</strong> {safe(getNormativeMatch(norm.id)?.caution)}</div>
          </div>
        {/if}

        <div style="margin-top: 1rem; display: grid; gap: 0.8rem;">
          <label style="display: flex; align-items: center; gap: 0.6rem; font-weight: 600;">
            <input
              type="checkbox"
              checked={!!getNormativeMatch(norm.id)?.selectedForUse}
              onchange={(e) =>
                onToggleNormativeSelection(
                  norm.id,
                  (e.currentTarget as HTMLInputElement).checked
                )}
            />
            Usar esta norma en el expediente
          </label>

          <div>
            <div style="font-weight: 700; margin-bottom: 0.5rem;">Asignar a documentos</div>
            <div
              style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 0.45rem 0.8rem;
              "
            >
              {#each documentUseOptions as option}
                <label style="display: flex; align-items: center; gap: 0.55rem;">
                  <input
                    type="checkbox"
                    checked={isNormSelectedForDocument(norm.id, option.key)}
                    onchange={(e) =>
                      onToggleNormativeDocumentUse(
                        norm.id,
                        option.key,
                        (e.currentTarget as HTMLInputElement).checked
                      )}
                  />
                  {option.label}
                </label>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/each}

    {#if candidateNorms.length === 0}
      <div style="color: #5f7286;">No se recuperaron normas candidatas.</div>
    {/if}
  </div>
</section>