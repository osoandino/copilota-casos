<script lang="ts">
  import type { CaseRecord, Evidence } from '$lib/types/case';
  import type {
    InstitutionRecommendation,
    PreliminaryReading,
    SuggestedDocument
  } from '$lib/logic/actionRoute';
  import type { GeneratedDocument } from '$lib/documents/generateDocuments';
  import type { RefinedVariant } from '$lib/logic/refineDocuments';
  import type {
    CaseNormativeAnalysis,
    CaseNormativeMatch,
    NormativeSource,
    DocumentUseKey
  } from '$lib/types/normative';
  import type { OperationalCaseAnalysis, ActionPattern } from '$lib/types/operational';

  import CaseSections from '$lib/components/CaseSections.svelte';
  import CaseEvidence from '$lib/components/CaseEvidence.svelte';
  import CaseTimeline from '$lib/components/CaseTimeline.svelte';
  import CaseActionRoute from '$lib/components/CaseActionRoute.svelte';
  import CaseDocuments from '$lib/components/CaseDocuments.svelte';
  import CaseRefinedDocuments from '$lib/components/CaseRefinedDocuments.svelte';
  import CaseNormativeModule from '$lib/components/CaseNormativeModule.svelte';

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
    caseData: CaseRecord | null;
    onUpdate: (field: keyof CaseRecord, value: string) => void;
    onAddEvidence: () => void;
    onUpdateEvidence: (evidenceId: string, field: keyof Evidence, value: string) => void;
    onDeleteEvidence: (evidenceId: string) => void;
    onUploadEvidenceFile: (evidenceId: string, file: File) => void;
    institutionRecommendation: InstitutionRecommendation | null;
    preliminaryReading: PreliminaryReading | null;
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
    normativeAnalysis: CaseNormativeAnalysis | null;
    candidateNorms: NormativeSource[];
    normativeMatches: CaseNormativeMatch[];
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
    operationalAnalysis: OperationalCaseAnalysis | null;
    operationalPrimaryCandidate: ActionPattern | null;
    operationalSecondaryCandidates: ActionPattern[];
  } = $props();

  let currentSection = $state('Narrar');
</script>

<div>
  <h2>Detalle del caso</h2>

  {#if !caseData}
    <p>Selecciona un caso.</p>
  {:else}
    <CaseSections
      {currentSection}
      onChange={(section) => {
        currentSection = section;
      }}
    />

    {#if currentSection === 'Narrar'}
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <label>
          <strong>Título</strong><br />
          <input
            value={caseData.title}
            oninput={(e) => onUpdate('title', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>

        <label>
          <strong>Quién reporta</strong><br />
          <input
            value={caseData.reporter}
            oninput={(e) => onUpdate('reporter', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>

        <label>
          <strong>Relato</strong><br />
          <textarea
            rows="8"
            oninput={(e) => onUpdate('narrative', (e.currentTarget as HTMLTextAreaElement).value)}
            style="width: 100%; padding: 0.5rem;"
          >{caseData.narrative}</textarea>
        </label>
      </div>
    {/if}

    {#if currentSection === 'Hechos'}
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <label>
          <strong>Comunidad</strong><br />
          <input
            value={caseData.community}
            oninput={(e) => onUpdate('community', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>

        <label>
          <strong>Lugar</strong><br />
          <input
            value={caseData.location}
            oninput={(e) => onUpdate('location', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>

        <label>
          <strong>Fecha aproximada de inicio</strong><br />
          <input
            type="date"
            value={caseData.dateStarted}
            oninput={(e) => onUpdate('dateStarted', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>

        <label>
          <strong>Personas o grupos afectados</strong><br />
          <input
            value={caseData.affectedPeople}
            oninput={(e) => onUpdate('affectedPeople', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>

        <label>
          <strong>Tipo de problema</strong><br />
          <input
            value={caseData.problemType}
            oninput={(e) => onUpdate('problemType', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>
      </div>
    {/if}

    {#if currentSection === 'Evidencia'}
      <CaseEvidence
        {caseData}
        {onAddEvidence}
        {onUpdateEvidence}
        {onDeleteEvidence}
        {onUploadEvidenceFile}
      />
    {/if}

    {#if currentSection === 'Seguimiento'}
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <label>
          <strong>Autoridad contactada</strong><br />
          <input
            value={caseData.authorityContacted}
            onblur={(e) => onUpdate('authorityContacted', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>

        <label>
          <strong>Respuesta institucional</strong><br />
          <textarea
            rows="6"
            onblur={(e) => onUpdate('authorityResponse', (e.currentTarget as HTMLTextAreaElement).value)}
            style="width: 100%; padding: 0.5rem;"
          >{caseData.authorityResponse}</textarea>
        </label>

        <label>
          <strong>Estado</strong><br />
          <input
            value={caseData.status}
            onblur={(e) => onUpdate('status', (e.currentTarget as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem;"
          />
        </label>
      </div>
    {/if}

    {#if currentSection === 'Bitácora'}
      <CaseTimeline {caseData} />
    {/if}

    {#if currentSection === 'Ruta de acción'}
      <CaseActionRoute
        {caseData}
        {institutionRecommendation}
        {preliminaryReading}
        {suggestedDocuments}
        {llmReading}
        llmReadingLoading={llmReadingLoading}
        llmReadingError={llmReadingError}
        llmReadingProviderUsed={llmReadingProviderUsed}
        selectedLLMProvider={selectedLLMProvider}
        onSelectLLMProvider={onSelectLLMProvider}
        onRunLLMReading={onRunLLMReading}
        operationalAnalysis={operationalAnalysis}
        operationalPrimaryCandidate={operationalPrimaryCandidate}
        operationalSecondaryCandidates={operationalSecondaryCandidates}
      />
    {/if}

    {#if currentSection === 'Marco normativo'}
      <CaseNormativeModule
        {caseData}
        {normativeAnalysis}
        candidateNorms={candidateNorms}
        normativeMatches={normativeMatches}
        selectedLLMProvider={selectedLLMProvider}
        onSelectLLMProvider={onSelectLLMProvider}
        normativeEvaluationLoading={normativeEvaluationLoading}
        normativeEvaluationError={normativeEvaluationError}
        normativeEvaluationProviderUsed={normativeEvaluationProviderUsed}
        onRunNormativeEvaluation={onRunNormativeEvaluation}
        onToggleNormativeSelection={onToggleNormativeSelection}
        onToggleNormativeDocumentUse={onToggleNormativeDocumentUse}
      />
    {/if}

    {#if currentSection === 'Documentos'}
      <CaseDocuments
        documents={generatedDocuments}
        selectedDocName={selectedDocumentName}
        onSelectDocument={onSelectDocument}
        onExportDocument={onExportDocument}
      />
    {/if}

    {#if currentSection === 'Refinamiento IA'}
      <CaseRefinedDocuments
        documents={generatedDocuments}
        selectedDocName={selectedDocumentName}
        {refinedVariants}
        selectedVariantKey={selectedVariantKey}
        onSelectDocument={onSelectDocument}
        onSelectVariant={onSelectVariant}
        onExportVariant={onExportVariant}
        selectedLLMProvider={selectedLLMProvider}
        onSelectLLMProvider={onSelectLLMProvider}
        {llmRefinedContent}
        {llmRefinedLoading}
        {llmRefinedError}
        llmRefinedProviderUsed={llmRefinedProviderUsed}
        onRunLLMRefine={onRunLLMRefine}
        onExportLLMVariant={onExportLLMVariant}
      />
    {/if}

    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ddd;">
      <strong>ID:</strong> {caseData.id}<br />
      <strong>Eventos:</strong> {caseData.events.length}<br />
      <strong>Evidencias:</strong> {caseData.evidence.length}
    </div>
  {/if}
</div>