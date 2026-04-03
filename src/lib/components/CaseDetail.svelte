<script lang="ts">
  import CaseSections from '$lib/components/CaseSections.svelte';
  import type { DocumentUseKey } from '$lib/types/normative';

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
    id: string;
    title?: string;
    community?: string;
    location?: string;
    dateStarted?: string;
    problemType?: string;
    affectedPeople?: string;
    status?: string;
    authorityContacted?: string;
    authorityResponse?: string;
    narrative?: string;
    evidence?: EvidenceItem[];
    events?: Array<{
      id: string;
      label?: string;
      notes?: string;
      createdAt?: string;
    }>;
  } | null;

  type InstitutionRecommendation = {
    primary?: string;
    secondary?: string;
    confidence?: string;
    reason?: string;
    nextStep?: string;
  } | null;

  type PreliminaryReading = {
    summary?: string;
    urgency?: string;
    suggestedAuthority?: string;
    firstStep?: string;
    missingInfo?: string[];
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
    caseData,
    onUpdate,
    onAddEvidence,
    onUpdateEvidence,
    onDeleteEvidence,
    onUploadEvidenceFile,
    institutionRecommendation,
    preliminaryReading,
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
    onExportLLMVariant,
    llmReading,
    llmReadingLoading,
    llmReadingError,
    llmReadingProviderUsed,
    onRunLLMReading,
    normativeAnalysis,
    candidateNorms,
    normativeMatches,
    normativeEvaluationLoading,
    normativeEvaluationError,
    normativeEvaluationProviderUsed,
    onRunNormativeEvaluation,
    onToggleNormativeSelection,
    onToggleNormativeDocumentUse,
    operationalAnalysis,
    operationalPrimaryCandidate,
    operationalSecondaryCandidates
  }: {
    caseData: CaseData;
    onUpdate: (field: string, value: string) => void;
    onAddEvidence: () => void;
    onUpdateEvidence: (evidenceId: string, field: string, value: string) => void;
    onDeleteEvidence: (evidenceId: string) => void;
    onUploadEvidenceFile: (evidenceId: string, file: File) => void;
    institutionRecommendation: InstitutionRecommendation;
    preliminaryReading: PreliminaryReading;
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
    llmReading: any | null;
    llmReadingLoading: boolean;
    llmReadingError: string;
    llmReadingProviderUsed: string;
    onRunLLMReading: () => void;
    normativeAnalysis: NormativeAnalysis;
    candidateNorms: CandidateNorm[];
    normativeMatches: NormativeMatch[];
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
    operationalAnalysis: OperationalAnalysis;
    operationalPrimaryCandidate: OperationalCandidate;
    operationalSecondaryCandidates: OperationalCandidate[];
  } = $props();

  let currentSection = $state('Narrar');

  const documentUseOptions: { key: DocumentUseKey; label: string }[] = [
    { key: 'ficha_resumen', label: 'Ficha resumen' },
    { key: 'solicitud_inspeccion', label: 'Solicitud de inspección' },
    { key: 'solicitud_informacion', label: 'Solicitud de información' },
    { key: 'nota_seguimiento', label: 'Nota de seguimiento' },
    { key: 'acta_comunitaria', label: 'Acta comunitaria' },
    { key: 'cronologia', label: 'Cronología' },
    { key: 'presentacion_alt', label: 'Presentación a la ALT' },
    { key: 'presentacion_defensoria', label: 'Presentación a Defensoría del Pueblo' }
  ];

  function getNormativeMatch(normId: string) {
    return normativeMatches.find((m) => m.normativeSourceId === normId);
  }

  function isNormSelectedForDocument(normId: string, key: DocumentUseKey) {
    const match = getNormativeMatch(normId);
    return !!match?.selectedForDocuments?.includes(key);
  }

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

  function prettyList(values?: string[]) {
    return values && values.length > 0 ? values.join(' · ') : '—';
  }

  function safe<T>(value: T | undefined | null, fallback = '—') {
    return value ? String(value) : fallback;
  }
</script>

{#if !caseData}
  <div
    style="
      padding: 1.2rem;
      border: 1px solid #d9e2ec;
      border-radius: 16px;
      background: #f8fafc;
      color: #526273;
    "
  >
    Selecciona o crea un caso para comenzar.
  </div>
{:else}
  <div style="display: grid; gap: 1rem;">
    <div
      style="
        padding: 1rem 1.1rem;
        border: 1px solid #dbe6ef;
        border-radius: 18px;
        background: white;
      "
    >
      <div style="font-size: 0.9rem; color: #5f7286; margin-bottom: 0.35rem;">
        Expediente activo
      </div>
      <div style="font-size: 1.35rem; font-weight: 800; color: #14202b;">
        {safe(caseData.title, 'Caso sin título')}
      </div>
      <div style="margin-top: 0.45rem; color: #5a6b7b; line-height: 1.5;">
        {safe(caseData.community)} · {safe(caseData.location)} · {safe(caseData.problemType)}
      </div>
    </div>

    <CaseSections
      currentSection={currentSection}
      onChange={(section) => (currentSection = section)}
    />

    {#if currentSection === 'Narrar'}
      <section
        style="
          padding: 1rem 1.1rem;
          border: 1px solid #dbe6ef;
          border-radius: 18px;
          background: white;
        "
      >
        <h2 style="margin-top: 0;">Narrar</h2>

        <div style="display: grid; gap: 0.85rem;">
          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Título del caso</div>
            <input
              value={caseData.title || ''}
              oninput={(e) => onUpdate('title', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Narrativa del caso</div>
            <textarea
              rows="10"
              value={caseData.narrative || ''}
              oninput={(e) => onUpdate('narrative', (e.currentTarget as HTMLTextAreaElement).value)}
              style="width: 100%; padding: 0.8rem; border: 1px solid #cfd8e3; border-radius: 12px; line-height: 1.55;"
            ></textarea>
          </label>
        </div>
      </section>
    {/if}

    {#if currentSection === 'Hechos'}
      <section
        style="
          padding: 1rem 1.1rem;
          border: 1px solid #dbe6ef;
          border-radius: 18px;
          background: white;
        "
      >
        <h2 style="margin-top: 0;">Hechos</h2>

        <div
          style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 0.9rem;
          "
        >
          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Comunidad</div>
            <input
              value={caseData.community || ''}
              oninput={(e) => onUpdate('community', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Ubicación</div>
            <input
              value={caseData.location || ''}
              oninput={(e) => onUpdate('location', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Inicio del problema</div>
            <input
              value={caseData.dateStarted || ''}
              oninput={(e) => onUpdate('dateStarted', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Tipo de problema</div>
            <input
              value={caseData.problemType || ''}
              oninput={(e) => onUpdate('problemType', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Personas afectadas</div>
            <input
              value={caseData.affectedPeople || ''}
              oninput={(e) => onUpdate('affectedPeople', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Estado del caso</div>
            <input
              value={caseData.status || ''}
              oninput={(e) => onUpdate('status', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>
        </div>
      </section>
    {/if}

    {#if currentSection === 'Evidencia'}
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
          {#if !caseData.evidence || caseData.evidence.length === 0}
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
    {/if}

    {#if currentSection === 'Seguimiento'}
      <section
        style="
          padding: 1rem 1.1rem;
          border: 1px solid #dbe6ef;
          border-radius: 18px;
          background: white;
        "
      >
        <h2 style="margin-top: 0;">Seguimiento</h2>

        <div style="display: grid; gap: 0.85rem;">
          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Autoridad contactada</div>
            <input
              value={caseData.authorityContacted || ''}
              oninput={(e) =>
                onUpdate('authorityContacted', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Respuesta institucional</div>
            <textarea
              rows="5"
              oninput={(e) =>
                onUpdate('authorityResponse', (e.currentTarget as HTMLTextAreaElement).value)}
              style="width: 100%; padding: 0.8rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            >{caseData.authorityResponse || ''}</textarea>
          </label>

          {#if caseData.events && caseData.events.length > 0}
            <div
              style="
                margin-top: 0.5rem;
                padding: 1rem;
                border-radius: 14px;
                background: #f8fbff;
                border: 1px solid #e2ebf3;
              "
            >
              <div style="font-weight: 700; margin-bottom: 0.6rem;">Últimos movimientos del expediente</div>
              <div style="display: grid; gap: 0.6rem;">
                {#each caseData.events.slice(0, 6) as evt}
                  <div style="font-size: 0.95rem; line-height: 1.45; color: #526273;">
                    <strong>{safe(evt.label, 'Movimiento')}</strong>
                    {#if evt.notes}
                      — {evt.notes}
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    {#if currentSection === 'Ruta de acción'}
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
    {/if}

    {#if currentSection === 'Marco normativo'}
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
    {/if}

    {#if currentSection === 'Documentos'}
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
    {/if}
  </div>
{/if}