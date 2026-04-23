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

  // ── Selector visual de tipo de problema ──────────────────────────────────

  // Cada chip guarda las señales exactas que usa el motor operacional para
  // detectar el patrón. Así el motor sigue funcionando sin ningún cambio.
  const PROBLEM_CHIPS = [
    {
      id:      'TOP-01-PTAR',
      icon:    '💧',
      label:   'Aguas sucias en río, lago o canal',
      signals: ['aguas residuales', 'descarga', 'canal', 'rebalse', 'espuma', 'ptar', 'alcantarillado']
    },
    {
      id:      'TOP-02-RESIDUOS',
      icon:    '🗑️',
      label:   'Basura o quema cerca del agua',
      signals: ['basura', 'botadero', 'quema', 'microbasural', 'lixiviados', 'plásticos en ribera']
    },
    {
      id:      'TOP-03-COHANA',
      icon:    '🐟',
      label:   'Agua verde, algas o animales muertos',
      signals: ['agua verde', 'algas', 'mortandad de peces', 'eutrofización', 'agua no usable']
    },
    {
      id:      'TOP-04-INUNDACION',
      icon:    '🌊',
      label:   'Inundación o desborde con daños',
      signals: ['inundación', 'desborde', 'riada', 'pérdida de cultivos', 'animales enfermos']
    },
    {
      id:      'TOP-05-DERRAME',
      icon:    '🛢️',
      label:   'Derrame de combustible u aceite',
      signals: ['derrame', 'combustible', 'aceite', 'mancha iridiscente', 'hidrocarburo']
    },
    {
      id:      'TOP-11-CONSULTA',
      icon:    '🏗️',
      label:   'Obra o proyecto sin consultar a la comunidad',
      signals: ['consulta', 'ya decidieron', 'socialización tardía', 'afectación a territorio', 'proyecto']
    },
    {
      id:      'TOP-12-DEFENSORAS',
      icon:    '🛡️',
      label:   'Me amenazaron por defender',
      signals: ['amenaza', 'hostigamiento', 'represalia', 'difamación', 'vigilancia']
    }
  ] as const;

  // Intenta reconocer chips a partir de un problemType ya guardado (texto libre
  // o de una selección anterior). Basta con que aparezca 1 señal del chip.
  function detectChipsFromText(pt: string): string[] {
    if (!pt) return [];
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const text = norm(pt);
    return PROBLEM_CHIPS
      .filter((chip) => chip.signals.some((sig) => text.includes(norm(sig))))
      .map((chip) => chip.id);
  }

  // Construye el string que se guarda en caseData.problemType.
  // Incluye el label visible + las señales clave del motor.
  function buildProblemTypeValue(ids: string[], otro: string): string {
    const parts = ids.map((id) => {
      const chip = PROBLEM_CHIPS.find((c) => c.id === id);
      if (!chip) return '';
      return `${chip.label} (${chip.signals.slice(0, 3).join(', ')})`;
    });
    if (otro.trim()) parts.push(otro.trim());
    return parts.filter(Boolean).join(' · ');
  }

  // Estado local de los chips — se sincroniza cuando cambia el caso activo
  let selectedChipIds = $state<string[]>([]);
  let otroText        = $state<string>('');
  let _lastCaseId     = $state('');

  $effect(() => {
    const currentId = caseData?.id ?? '';
    if (currentId !== _lastCaseId) {
      _lastCaseId      = currentId;
      selectedChipIds  = detectChipsFromText(caseData?.problemType ?? '');
      otroText         = '';
    }
  });

  const showOtro = $derived(selectedChipIds.includes('__OTRO__'));

  function toggleChip(id: string) {
    if (id === '__OTRO__') {
      selectedChipIds = selectedChipIds.includes('__OTRO__')
        ? selectedChipIds.filter((x) => x !== '__OTRO__')
        : [...selectedChipIds, '__OTRO__'];
    } else {
      selectedChipIds = selectedChipIds.includes(id)
        ? selectedChipIds.filter((x) => x !== id)
        : [...selectedChipIds, id];
    }
    onUpdate('problemType', buildProblemTypeValue(selectedChipIds.filter((x) => x !== '__OTRO__'), otroText));
  }

  function handleOtroInput(value: string) {
    otroText = value;
    onUpdate('problemType', buildProblemTypeValue(selectedChipIds.filter((x) => x !== '__OTRO__'), value));
  }

  // Detecta automáticamente qué secciones ya tienen contenido suficiente
  const completedSections = $derived(
    (() => {
      const done: string[] = [];

      // Narrar: narrativa con al menos 30 caracteres y título con al menos 5
      if ((caseData?.narrative?.trim().length ?? 0) >= 30 &&
          (caseData?.title?.trim().length ?? 0) >= 5)
        done.push('Narrar');

      // Hechos: comunidad Y (ubicación O fecha) deben estar completos
      if (caseData?.community?.trim() &&
         (caseData?.location?.trim() || caseData?.dateStarted?.trim()))
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
              onblur={(e) => onUpdate('title', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Narrativa del caso</div>
            <textarea
              rows="10"
              value={caseData.narrative || ''}
              onblur={(e) => onUpdate('narrative', (e.currentTarget as HTMLTextAreaElement).value)}
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
              onblur={(e) => onUpdate('community', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Ubicación</div>
            <input
              value={caseData.location || ''}
              onblur={(e) => onUpdate('location', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Inicio del problema</div>
            <input
              value={caseData.dateStarted || ''}
              onblur={(e) => onUpdate('dateStarted', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <!-- ── Selector visual de tipo de problema ── -->
          <div style="grid-column: 1 / -1;">
            <div style="margin-bottom: 0.55rem; font-weight: 600;">
              ¿Qué pasó? <span style="font-weight: 400; color: #6b7c8d; font-size: 0.9rem;">(puedes elegir más de uno)</span>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;">
              {#each PROBLEM_CHIPS as chip}
                <button
                  type="button"
                  onclick={() => toggleChip(chip.id)}
                  style={`
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 0.9rem;
                    border-radius: 999px;
                    border: 2px solid ${selectedChipIds.includes(chip.id) ? '#1B5C8C' : '#cfd8e3'};
                    background: ${selectedChipIds.includes(chip.id) ? '#e3f0fa' : 'white'};
                    color: ${selectedChipIds.includes(chip.id) ? '#1B5C8C' : '#4a5f72'};
                    font-weight: ${selectedChipIds.includes(chip.id) ? '700' : '500'};
                    font-size: 0.88rem;
                    cursor: pointer;
                    transition: background 0.15s, border-color 0.15s, color 0.15s;
                    font-family: inherit;
                  `}
                  aria-pressed={selectedChipIds.includes(chip.id)}
                >
                  <span style="font-size: 1rem;">{chip.icon}</span>
                  {chip.label}
                </button>
              {/each}

              <!-- Chip: Otro -->
              <button
                type="button"
                onclick={() => toggleChip('__OTRO__')}
                style={`
                  display: inline-flex;
                  align-items: center;
                  gap: 0.4rem;
                  padding: 0.5rem 0.9rem;
                  border-radius: 999px;
                  border: 2px solid ${showOtro ? '#1B5C8C' : '#cfd8e3'};
                  background: ${showOtro ? '#e3f0fa' : 'white'};
                  color: ${showOtro ? '#1B5C8C' : '#4a5f72'};
                  font-weight: ${showOtro ? '700' : '500'};
                  font-size: 0.88rem;
                  cursor: pointer;
                  transition: background 0.15s, border-color 0.15s, color 0.15s;
                  font-family: inherit;
                `}
                aria-pressed={showOtro}
              >
                <span style="font-size: 1rem;">➕</span>
                Otro problema
              </button>
            </div>

            <!-- Campo libre cuando se selecciona "Otro" -->
            {#if showOtro}
              <div style="margin-top: 0.4rem;">
                <input
                  value={otroText}
                  oninput={(e) => handleOtroInput((e.currentTarget as HTMLInputElement).value)}
                  placeholder="Describe el problema con tus propias palabras…"
                  style="
                    width: 100%;
                    padding: 0.7rem;
                    border: 1px solid #cfd8e3;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-family: inherit;
                    box-sizing: border-box;
                  "
                />
              </div>
            {/if}

            <!-- Resumen de lo seleccionado -->
            {#if selectedChipIds.length > 0 || otroText.trim()}
              <div style="
                margin-top: 0.55rem;
                padding: 0.55rem 0.8rem;
                background: #f0f6fb;
                border: 1px solid #c4d9ee;
                border-radius: 10px;
                font-size: 0.85rem;
                color: #2c5f8a;
                line-height: 1.5;
              ">
                <strong>Guardado como:</strong>
                {buildProblemTypeValue(selectedChipIds.filter((x) => x !== '__OTRO__'), otroText)}
              </div>
            {/if}
          </div>

          <label>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Personas afectadas</div>
            <input
              value={caseData.affectedPeople || ''}
              onblur={(e) => onUpdate('affectedPeople', (e.currentTarget as HTMLInputElement).value)}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px;"
            />
          </label>

          <div>
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Estado del caso</div>
            <select
              value={caseData.status || ''}
              onchange={(e) => onUpdate('status', (e.currentTarget as HTMLSelectElement).value)}
              style="
                width: 100%;
                padding: 0.7rem;
                border: 1px solid #cfd8e3;
                border-radius: 12px;
                background: white;
                font-family: inherit;
                font-size: 1rem;
                color: #2c3e50;
                appearance: auto;
              "
            >
              <option value="">— Seleccionar estado —</option>
              <option value="🔴 Recién comenzado">🔴 Recién comenzado</option>
              <option value="🟡 En proceso">🟡 En proceso</option>
              <option value="📤 Presentado a autoridad">📤 Presentado a autoridad</option>
              <option value="⏳ Esperando respuesta">⏳ Esperando respuesta</option>
              <option value="🔄 Con seguimiento activo">🔄 Con seguimiento activo</option>
              <option value="✅ Resuelto">✅ Resuelto</option>
              <option value="⏸️ Pausado">⏸️ Pausado</option>
              <option value="❌ Archivado">❌ Archivado</option>
            </select>
          </div>
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