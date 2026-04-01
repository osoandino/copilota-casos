<script lang="ts">
  import type { CaseRecord } from '$lib/types/case';
  import type {
    CaseNormativeAnalysis,
    CaseNormativeMatch,
    NormativeSource,
    DocumentUseKey
  } from '$lib/types/normative';
  import { documentUseOptions } from '$lib/logic/normativeLabels';

  let {
    caseData,
    normativeAnalysis,
    candidateNorms,
    normativeMatches,
    selectedLLMProvider,
    onSelectLLMProvider,
    normativeEvaluationLoading,
    normativeEvaluationError,
    normativeEvaluationProviderUsed,
    onRunNormativeEvaluation,
    onToggleNormativeSelection,
    onToggleNormativeDocumentUse
  }: {
    caseData: CaseRecord | null;
    normativeAnalysis: CaseNormativeAnalysis | null;
    candidateNorms: NormativeSource[];
    normativeMatches: CaseNormativeMatch[];
    selectedLLMProvider: string;
    onSelectLLMProvider: (provider: string) => void;
    normativeEvaluationLoading: boolean;
    normativeEvaluationError: string;
    normativeEvaluationProviderUsed: string;
    onRunNormativeEvaluation: () => void;
    onToggleNormativeSelection: (normativeSourceId: string, selected: boolean) => void;
    onToggleNormativeDocumentUse: (
      normativeSourceId: string,
      documentUse: DocumentUseKey,
      selected: boolean
    ) => void;
  } = $props();

  function matchByNormId(normId: string) {
    return normativeMatches.find((m) => m.normativeSourceId === normId);
  }

  function selectedLabels(match: CaseNormativeMatch) {
    return documentUseOptions
      .filter((opt) => match.selectedForDocuments.includes(opt.key))
      .map((opt) => opt.label);
  }
</script>

<div>
  <h2>Marco normativo</h2>

  {#if !caseData || !normativeAnalysis}
    <p>Selecciona un caso.</p>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div
        style="
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          padding: 1rem;
          background: #fafafa;
        "
      >
        <h3>Análisis temático del caso</h3>
        <p><strong>Resumen:</strong> {normativeAnalysis.summary}</p>
        <p><strong>Urgencia:</strong> {normativeAnalysis.urgencyLevel}</p>
        <p><strong>Temas detectados:</strong> {normativeAnalysis.detectedThemes.join(', ') || 'Ninguno'}</p>
        <p><strong>Derechos posibles:</strong> {normativeAnalysis.possibleRights.join(', ') || 'Ninguno'}</p>
        <p><strong>Instituciones posibles:</strong> {normativeAnalysis.possibleInstitutions.join(', ') || 'Ninguna'}</p>
        <p><strong>Procedimientos posibles:</strong> {normativeAnalysis.possibleProcedures.join(', ') || 'Ninguno'}</p>
        <p><strong>Palabras clave:</strong> {normativeAnalysis.retrievalKeywords.join(', ') || 'Ninguna'}</p>
      </div>

      <div style="display: flex; gap: 1rem; align-items: end; flex-wrap: wrap;">
        <label>
          <strong>Proveedor LLM</strong><br />
          <select
            value={selectedLLMProvider}
            onchange={(e) => onSelectLLMProvider((e.currentTarget as HTMLSelectElement).value)}
            style="padding: 0.5rem; min-width: 180px;"
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>

        <button onclick={onRunNormativeEvaluation} disabled={normativeEvaluationLoading}>
          {normativeEvaluationLoading ? 'Valorando...' : 'Valorar normas con IA'}
        </button>
      </div>

      <div
        style="
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          padding: 1rem;
          background: #f8fafc;
        "
      >
        <strong>Proveedor solicitado:</strong> {selectedLLMProvider}<br />
        <strong>Proveedor que respondió:</strong> {normativeEvaluationProviderUsed || 'Sin respuesta todavía'}
      </div>

      {#if normativeEvaluationError}
        <div style="color: #b91c1c;">
          {normativeEvaluationError}
        </div>
      {/if}

      <div>
        <h3>Normas candidatas recuperadas</h3>

        {#if candidateNorms.length === 0}
          <p>No se recuperaron normas candidatas todavía.</p>
        {:else}
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            {#each candidateNorms as norm}
              {@const match = matchByNormId(norm.id)}
              <div
                style={`
                  border: 1px solid #ccc;
                  border-radius: 0.5rem;
                  padding: 1rem;
                  background: ${match?.selectedForUse ? '#f9fffb' : 'white'};
                `}
              >
                <div style="margin-bottom: 0.5rem;">
                  <strong>{norm.normTitle}</strong><br />
                  <span>{norm.article}</span><br />
                  <span style="font-size: 0.9rem; color: #666;">
                    {norm.country} | {norm.jurisdictionLevel} | {norm.validityStatus}
                  </span>
                </div>

                <div style="margin-bottom: 0.75rem; white-space: pre-wrap;">
                  {norm.excerpt}
                </div>

                <div style="font-size: 0.9rem; color: #444;">
                  <strong>Temas:</strong> {norm.themeTags.join(', ')}<br />
                  <strong>Derechos:</strong> {norm.rightsTags.join(', ')}<br />
                  <strong>Instituciones:</strong> {norm.institutionTags.join(', ')}<br />
                  <strong>Procedimientos:</strong> {norm.procedureTags.join(', ')}<br />
                  <strong>Uso documental sugerido:</strong> {norm.documentUseTags.join(', ')}
                </div>

                {#if match}
                  <div
                    style="
                      margin-top: 1rem;
                      border-top: 1px solid #ddd;
                      padding-top: 0.75rem;
                    "
                  >
                    <strong>Valoración asistida</strong><br />
                    <strong>Relevancia:</strong> {match.relevance}<br />
                    <strong>Función en el caso:</strong> {match.functionInCase}<br />
                    <strong>Por qué podría aplicar:</strong>
                    <p>{match.rationale}</p>
                    <strong>Hecho que la activa:</strong>
                    <p>{match.triggeringFact}</p>
                    <strong>Qué falta para usarla mejor:</strong>
                    <p>{match.missingForStrongerUse}</p>
                    <strong>Cautela:</strong>
                    <p>{match.caution}</p>

                    <div
                      style="
                        margin-top: 1rem;
                        padding: 0.75rem;
                        border: 1px solid #e5e7eb;
                        border-radius: 0.5rem;
                        background: #fafafa;
                      "
                    >
                      <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input
                          type="checkbox"
                          checked={match.selectedForUse}
                          onchange={(e) =>
                            onToggleNormativeSelection(
                              norm.id,
                              (e.currentTarget as HTMLInputElement).checked
                            )}
                        />
                        <strong>Usar esta norma en el expediente</strong>
                      </label>

                      <div style="margin-top: 0.75rem;">
                        <strong>Asignar a documentos</strong>
                        <p style="margin: 0.35rem 0 0.6rem 0; font-size: 0.9rem; color: #666;">
                          Puedes marcar directamente los documentos. Al hacerlo, la norma queda seleccionada automáticamente para uso en el expediente.
                        </p>

                        <div
                          style="
                            display: grid;
                            grid-template-columns: repeat(2, minmax(220px, 1fr));
                            gap: 0.5rem;
                            margin-top: 0.5rem;
                          "
                        >
                          {#each documentUseOptions as option}
                            <label
                              style="
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;
                              "
                            >
                              <input
                                type="checkbox"
                                checked={match.selectedForDocuments.includes(option.key)}
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

                      <div style="margin-top: 0.75rem; font-size: 0.95rem;">
                        <strong>Documentos asignados:</strong>
                        {#if selectedLabels(match).length > 0}
                          {selectedLabels(match).join(', ')}
                        {:else}
                          Ninguno todavía.
                        {/if}
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>