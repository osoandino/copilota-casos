<script lang="ts">
  import CaseActionRouteSection from '$lib/components/CaseActionRouteSection.svelte';
  import CaseEvidenceSection from '$lib/components/CaseEvidenceSection.svelte';
  import CaseNormativeSection from '$lib/components/CaseNormativeSection.svelte';
  import CaseDocumentsSection from '$lib/components/CaseDocumentsSection.svelte';
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

  // Detecta automáticamente qué secciones ya tienen contenido suficiente
  const completedSections = $derived(
    (() => {
      const done: string[] = [];

      // Narrar: tiene narrativa escrita
      if (caseData?.narrative?.trim()) done.push('Narrar');

      // Hechos: al menos comunidad o ubicación registradas
      if (caseData?.community?.trim() || caseData?.location?.trim() || caseData?.dateStarted?.trim())
        done.push('Hechos');

      // Evidencia: al menos un elemento cargado
      if ((caseData?.evidence?.length ?? 0) > 0) done.push('Evidencia');

      // Ruta de acción: se ejecutó el análisis IA
      if (llmReading != null) done.push('Ruta de acción');

      // Marco normativo: al menos una norma seleccionada para uso
      if (normativeMatches?.some((m) => m.selectedForUse)) done.push('Marco normativo');

      // Documentos: al menos un documento generado
      if (generatedDocuments?.length > 0) done.push('Documentos');

      return done;
    })()
  );

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
      completedSections={completedSections}
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
      <CaseEvidenceSection
        {caseData}
        onAddEvidence={onAddEvidence}
        onUpdateEvidence={onUpdateEvidence}
        onDeleteEvidence={onDeleteEvidence}
        onUploadEvidenceFile={onUploadEvidenceFile}
      />
    {/if}

    {#if currentSection === 'Ruta de acción'}
      <CaseActionRouteSection
        {selectedLLMProvider}
        onSelectLLMProvider={onSelectLLMProvider}
        onRunLLMReading={onRunLLMReading}
        {llmReading}
        {llmReadingLoading}
        {llmReadingError}
        {llmReadingProviderUsed}
        {institutionRecommendation}
        {operationalAnalysis}
        {operationalPrimaryCandidate}
      />
    {/if}

    {#if currentSection === 'Marco normativo'}
      <CaseNormativeSection
        {normativeAnalysis}
        {candidateNorms}
        {normativeMatches}
        {normativeEvaluationLoading}
        {normativeEvaluationError}
        {normativeEvaluationProviderUsed}
        {selectedLLMProvider}
        onSelectLLMProvider={onSelectLLMProvider}
        onRunNormativeEvaluation={onRunNormativeEvaluation}
        onToggleNormativeSelection={onToggleNormativeSelection}
        onToggleNormativeDocumentUse={onToggleNormativeDocumentUse}
      />
    {/if}

    {#if currentSection === 'Documentos'}
      <CaseDocumentsSection
        {caseData}
        {suggestedDocuments}
        {generatedDocuments}
        {selectedDocumentName}
        onSelectDocument={onSelectDocument}
        onExportDocument={onExportDocument}
        {refinedVariants}
        {selectedVariantKey}
        onSelectVariant={onSelectVariant}
        onExportVariant={onExportVariant}
        {selectedLLMProvider}
        onSelectLLMProvider={onSelectLLMProvider}
        {llmRefinedContent}
        {llmRefinedLoading}
        {llmRefinedError}
        {llmRefinedProviderUsed}
        onRunLLMRefine={onRunLLMRefine}
        onExportLLMVariant={onExportLLMVariant}
      />
    {/if}
  </div>
{/if}