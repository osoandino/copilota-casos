<script lang="ts">
  type InstitutionRecommendation = {
    primary?: string;
    secondary?: string;
    confidence?: string;
    reason?: string;
    nextStep?: string;
  } | null;

  type OperationalCandidate = {
    label?: string;
    shortDescription?: string;
  } | null;

  type OperationalAnalysis = {
    summary?: string;
    urgency?: string;
    signals?: string[];
    missingEvidence?: string[];
    firstStep?: string;
    escalation?: string;
    suggestedAuthorities?: string[];
    recommendedTemplates?: string[];
  } | null;

  let {
    selectedLLMProvider,
    onSelectLLMProvider,
    onRunLLMReading,
    llmReading,
    llmReadingLoading,
    llmReadingError,
    llmReadingProviderUsed,
    institutionRecommendation,
    operationalAnalysis,
    operationalPrimaryCandidate
  }: {
    selectedLLMProvider: string;
    onSelectLLMProvider: (provider: string) => void;
    onRunLLMReading: () => void;
    llmReading: any | null;
    llmReadingLoading: boolean;
    llmReadingError: string;
    llmReadingProviderUsed: string;
    institutionRecommendation: InstitutionRecommendation;
    operationalAnalysis: OperationalAnalysis;
    operationalPrimaryCandidate: OperationalCandidate;
  } = $props();

  function prettyList(values?: string[]) {
    return values && values.length > 0 ? values.join(' · ') : '—';
  }

  function safe<T>(value: T | undefined | null, fallback = '—') {
    return value ? String(value) : fallback;
  }
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
    <h2 style="margin: 0;">Ruta de acción</h2>
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
        onclick={onRunLLMReading}
        disabled={llmReadingLoading}
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
        {llmReadingLoading ? 'Procesando…' : 'Enriquecer con IA'}
      </button>
    </div>
  </div>

  <div style="display: grid; gap: 1rem; margin-top: 1rem;">
    <div
      style="
        padding: 1rem;
        border: 1px solid #e2ebf3;
        border-radius: 16px;
        background: #f8fbff;
      "
    >
      <div style="font-weight: 700; margin-bottom: 0.5rem;">Resumen operativo</div>
      <div style="line-height: 1.55; color: #46576a;">
        {safe(operationalAnalysis?.summary)}
      </div>

      <div style="margin-top: 0.8rem; display: grid; gap: 0.45rem;">
        <div><strong>Urgencia:</strong> {safe(operationalAnalysis?.urgency)}</div>
        <div><strong>Patrón principal:</strong> {safe(operationalPrimaryCandidate?.label)}</div>
        <div><strong>Descripción:</strong> {safe(operationalPrimaryCandidate?.shortDescription)}</div>
        <div><strong>Primer paso:</strong> {safe(operationalAnalysis?.firstStep)}</div>
        <div><strong>Escalamiento:</strong> {safe(operationalAnalysis?.escalation)}</div>
      </div>
    </div>

    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
      "
    >
      <div
        style="
          padding: 1rem;
          border: 1px solid #e2ebf3;
          border-radius: 16px;
          background: white;
        "
      >
        <div style="font-weight: 700; margin-bottom: 0.45rem;">Señales detectadas</div>
        <div style="color: #556677; line-height: 1.55;">
          {prettyList(operationalAnalysis?.signals)}
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
        <div style="font-weight: 700; margin-bottom: 0.45rem;">Evidencia faltante</div>
        <div style="color: #556677; line-height: 1.55;">
          {prettyList(operationalAnalysis?.missingEvidence)}
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
        <div style="font-weight: 700; margin-bottom: 0.45rem;">Autoridades sugeridas</div>
        <div style="color: #556677; line-height: 1.55;">
          {prettyList(operationalAnalysis?.suggestedAuthorities)}
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
        <div style="font-weight: 700; margin-bottom: 0.45rem;">Plantillas recomendadas</div>
        <div style="color: #556677; line-height: 1.55;">
          {prettyList(operationalAnalysis?.recommendedTemplates)}
        </div>
      </div>
    </div>

    {#if institutionRecommendation}
      <div
        style="
          padding: 1rem;
          border: 1px solid #e2ebf3;
          border-radius: 16px;
          background: #fbfdff;
        "
      >
        <div style="font-weight: 700; margin-bottom: 0.45rem;">Ruta institucional sugerida</div>
        <div style="line-height: 1.6; color: #4d5f71;">
          <div><strong>Institución principal:</strong> {safe(institutionRecommendation.primary)}</div>
          <div><strong>Alternativa:</strong> {safe(institutionRecommendation.secondary)}</div>
          <div><strong>Razón:</strong> {safe(institutionRecommendation.reason)}</div>
          <div><strong>Siguiente paso:</strong> {safe(institutionRecommendation.nextStep)}</div>
        </div>
      </div>
    {/if}

    {#if llmReadingError}
      <div style="color: #a12d2d;">{llmReadingError}</div>
    {/if}

    {#if llmReading}
      <div
        style="
          padding: 1rem;
          border: 1px solid #dbe6ef;
          border-radius: 16px;
          background: #ffffff;
        "
      >
        <div style="font-weight: 700; margin-bottom: 0.5rem;">
          Lectura enriquecida con IA
          {#if llmReadingProviderUsed}
            <span style="font-weight: 500; color: #6a7b8c;">({llmReadingProviderUsed})</span>
          {/if}
        </div>

        <div style="display: grid; gap: 0.55rem; line-height: 1.55; color: #4e6072;">
          <div><strong>Posibles afectaciones:</strong> {prettyList(llmReading.possible_affectations)}</div>
          <div><strong>Estado del expediente:</strong> {safe(llmReading.dossier_state)}</div>
          <div><strong>Vacíos críticos:</strong> {prettyList(llmReading.critical_gaps)}</div>
          <div><strong>Resumen de evidencia:</strong> {safe(llmReading.evidence_summary)}</div>
          <div><strong>Inconsistencias:</strong> {prettyList(llmReading.inconsistencies)}</div>
          <div><strong>Acción recomendada:</strong> {safe(llmReading.recommended_action)}</div>
          <div><strong>Comentario institucional:</strong> {safe(llmReading.institutional_route_comment)}</div>
        </div>
      </div>
    {/if}
  </div>
</section>