<script lang="ts">
  import type { CaseRecord } from '$lib/types/case';
  import type {
    InstitutionRecommendation,
    PreliminaryReading,
    SuggestedDocument
  } from '$lib/logic/actionRoute';
  import type { OperationalCaseAnalysis, ActionPattern } from '$lib/types/operational';

  let {
    caseData,
    institutionRecommendation,
    preliminaryReading,
    suggestedDocuments,
    llmReading,
    llmReadingLoading,
    llmReadingError,
    llmReadingProviderUsed,
    selectedLLMProvider,
    onSelectLLMProvider,
    onRunLLMReading,
    operationalAnalysis,
    operationalPrimaryCandidate,
    operationalSecondaryCandidates
  }: {
    caseData: CaseRecord | null;
    institutionRecommendation: InstitutionRecommendation | null;
    preliminaryReading: PreliminaryReading | null;
    suggestedDocuments: SuggestedDocument[];
    llmReading: any | null;
    llmReadingLoading: boolean;
    llmReadingError: string;
    llmReadingProviderUsed: string;
    selectedLLMProvider: string;
    onSelectLLMProvider: (provider: string) => void;
    onRunLLMReading: () => void;
    operationalAnalysis: OperationalCaseAnalysis | null;
    operationalPrimaryCandidate: ActionPattern | null;
    operationalSecondaryCandidates: ActionPattern[];
  } = $props();
</script>

<div>
  <h2>Ruta de acción</h2>

  {#if !caseData}
    <p>Selecciona un caso.</p>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="border: 2px solid #cbd5e1; border-radius: 0.5rem; padding: 1rem; background: #f8fafc;">
        <h3>Lectura operativo-jurídica</h3>

        {#if operationalAnalysis}
          <p><strong>Resumen:</strong> {operationalAnalysis.summary}</p>
          <p><strong>Urgencia:</strong> {operationalAnalysis.urgency}</p>

          <div style="margin-top: 0.75rem;">
            <strong>Patrón principal</strong>
            {#if operationalPrimaryCandidate}
              <div style="margin-top: 0.4rem; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; background: white;">
                <strong>{operationalPrimaryCandidate.label}</strong><br />
                <span style="font-size: 0.95rem; color: #444;">
                  {operationalPrimaryCandidate.shortDescription}
                </span>
              </div>
            {:else}
              <p>No se identificó un patrón principal.</p>
            {/if}
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Patrones secundarios</strong>
            <ul>
              {#if operationalSecondaryCandidates.length > 0}
                {#each operationalSecondaryCandidates as pattern}
                  <li>
                    <strong>{pattern.label}</strong><br />
                    <span style="font-size: 0.95rem; color: #444;">
                      {pattern.shortDescription}
                    </span>
                  </li>
                {/each}
              {:else}
                <li>No se identificaron patrones secundarios relevantes.</li>
              {/if}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Señales detectadas</strong>
            <ul>
              {#if operationalAnalysis.detectedSignals.length > 0}
                {#each operationalAnalysis.detectedSignals as item}
                  <li>{item}</li>
                {/each}
              {:else}
                <li>No se detectaron señales operativas específicas.</li>
              {/if}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Evidencia mínima faltante</strong>
            <ul>
              {#if operationalAnalysis.missingEvidence.length > 0}
                {#each operationalAnalysis.missingEvidence as item}
                  <li>{item}</li>
                {/each}
              {:else}
                <li>No se identifican vacíos críticos de evidencia en esta fase.</li>
              {/if}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Primer paso recomendado</strong>
            <ul>
              {#if operationalAnalysis.primaryActions.length > 0}
                {#each operationalAnalysis.primaryActions as item}
                  <li>{item}</li>
                {/each}
              {:else}
                <li>Sin acción primaria definida todavía.</li>
              {/if}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Ruta de escalamiento</strong>
            <ul>
              {#if operationalAnalysis.escalationActions.length > 0}
                {#each operationalAnalysis.escalationActions as item}
                  <li>{item}</li>
                {/each}
              {:else}
                <li>Sin ruta de escalamiento definida todavía.</li>
              {/if}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Autoridades sugeridas</strong>
            <ul>
              {#if operationalAnalysis.likelyAuthorities.length > 0}
                {#each operationalAnalysis.likelyAuthorities as item}
                  <li>{item}</li>
                {/each}
              {:else}
                <li>No se identificaron autoridades probables.</li>
              {/if}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Plantillas recomendadas</strong>
            <ul>
              {#if operationalAnalysis.recommendedTemplates.length > 0}
                {#each operationalAnalysis.recommendedTemplates as item}
                  <li>{item}</li>
                {/each}
              {:else}
                <li>No hay plantillas sugeridas todavía.</li>
              {/if}
            </ul>
          </div>
        {:else}
          <p>No se generó todavía una lectura operativa para este caso.</p>
        {/if}
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

        <button onclick={onRunLLMReading} disabled={llmReadingLoading}>
          {llmReadingLoading ? 'Analizando...' : 'Enriquecer con LLM real'}
        </button>
      </div>

      <div style="border: 1px solid #ccc; border-radius: 0.5rem; padding: 1rem;">
        <h3>Institución sugerida</h3>
        {#if institutionRecommendation}
          <p><strong>Principal:</strong> {institutionRecommendation.primary}</p>
          <p><strong>Alternativa:</strong> {institutionRecommendation.secondary}</p>
          <p><strong>Confianza:</strong> {institutionRecommendation.confidence}</p>
          <p><strong>Razón:</strong> {institutionRecommendation.reason}</p>
          <p><strong>Siguiente paso:</strong> {institutionRecommendation.nextStep}</p>
        {:else}
          <p>No hay institución sugerida todavía.</p>
        {/if}
      </div>

      <div style="border: 1px solid #ccc; border-radius: 0.5rem; padding: 1rem;">
        <h3>Lectura preliminar local</h3>
        {#if preliminaryReading}
          <p><strong>Estado del expediente:</strong> {preliminaryReading.dossierState}</p>

          <div style="margin-top: 0.75rem;">
            <strong>Posibles afectaciones</strong>
            <ul>
              {#each preliminaryReading.findings as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Vacíos críticos</strong>
            <ul>
              {#if preliminaryReading.criticalGaps.length === 0}
                <li>No se detectan vacíos críticos inmediatos.</li>
              {:else}
                {#each preliminaryReading.criticalGaps as item}
                  <li>{item}</li>
                {/each}
              {/if}
            </ul>
          </div>

          <div style="margin-top: 0.75rem;">
            <strong>Recomendación jurídico-operativa</strong>
            <p>{preliminaryReading.legalOperationalSuggestion}</p>
          </div>
        {:else}
          <p>No hay lectura preliminar todavía.</p>
        {/if}
      </div>

      <div style="border: 1px solid #ccc; border-radius: 0.5rem; padding: 1rem;">
        <h3>Lectura enriquecida con backend LLM real</h3>

        <div style="border: 1px solid #ddd; border-radius: 0.5rem; padding: 0.75rem; background: #f8fafc; margin-bottom: 0.75rem;">
          <strong>Proveedor solicitado:</strong> {selectedLLMProvider}<br />
          <strong>Proveedor que respondió:</strong> {llmReadingProviderUsed || 'Sin respuesta todavía'}
        </div>

        {#if llmReadingError}
          <div style="color: #b91c1c; margin-bottom: 1rem;">
            {llmReadingError}
          </div>
        {/if}

        {#if !llmReading && !llmReadingError}
          <p>Todavía no se solicitó enriquecimiento al backend.</p>
        {/if}

        {#if llmReading}
          <div style="display: flex; flex-direction: column; gap: 0.9rem;">
            <div>
              <strong>Posibles afectaciones</strong>
              <ul>
                {#if (llmReading.possible_affectations || []).length > 0}
                  {#each llmReading.possible_affectations as item}
                    <li>{item}</li>
                  {/each}
                {:else}
                  <li>Sin dato.</li>
                {/if}
              </ul>
            </div>

            <div>
              <strong>Estado del expediente</strong>
              <p>{llmReading.dossier_state || 'Sin dato'}</p>
            </div>

            <div>
              <strong>Vacíos críticos</strong>
              <ul>
                {#if (llmReading.critical_gaps || []).length > 0}
                  {#each llmReading.critical_gaps as item}
                    <li>{item}</li>
                  {/each}
                {:else}
                  <li>No se reportan vacíos críticos.</li>
                {/if}
              </ul>
            </div>

            <div>
              <strong>Resumen de evidencia</strong>
              <p>{llmReading.evidence_summary || 'Sin dato'}</p>
            </div>

            <div>
              <strong>Inconsistencias</strong>
              <ul>
                {#if (llmReading.inconsistencies || []).length > 0}
                  {#each llmReading.inconsistencies as item}
                    <li>{item}</li>
                  {/each}
                {:else}
                  <li>No se reportan inconsistencias.</li>
                {/if}
              </ul>
            </div>

            <div>
              <strong>Acción recomendada</strong>
              <p>{llmReading.recommended_action || 'Sin dato'}</p>
            </div>

            <div>
              <strong>Comentario sobre ruta institucional</strong>
              <p>{llmReading.institutional_route_comment || 'Sin dato'}</p>
            </div>
          </div>
        {/if}
      </div>

      <div style="border: 1px solid #ccc; border-radius: 0.5rem; padding: 1rem;">
        <h3>Documentos recomendados</h3>

        {#if suggestedDocuments.length === 0}
          <p>No hay documentos sugeridos.</p>
        {:else}
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            {#each suggestedDocuments as doc}
              <div style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem;">
                <strong>{doc.name}</strong>
                <p style="margin-top: 0.4rem;">{doc.why}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>