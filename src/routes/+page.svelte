<script lang="ts">
  import { onMount } from 'svelte';
  import { saveCase, deleteCase } from '$lib/db/cases';
  import { getAllCasesWithRelations } from '$lib/db/fullCases';
  import { createEmptyCase } from '$lib/logic/caseFactory';
  import {
    recommendInstitution,
    getPreliminaryReading,
    recommendDocuments
  } from '$lib/logic/actionRoute';
  import { buildGeneratedDocuments } from '$lib/documents/generateDocuments';
  import { buildRefinedDocumentVariants } from '$lib/logic/refineDocuments';
  import {
    retrieveCandidateNorms,
    buildInitialNormativeMatches
  } from '$lib/logic/normativeEngine';
  import {
    buildNormativeEvaluationPrompt,
    type NormativeAIEvaluation
  } from '$lib/logic/normativeAI';
  import { analyzeOperationalRoutes } from '$lib/logic/operationalEngine';
  import { normativeSeed } from '$lib/data/normativeSeed';
  import { operationalSeed } from '$lib/data/operationalSeed';
  import {
    refineWithLLM,
    enrichReadingWithLLM,
    evaluateNormsWithLLM
  } from '$lib/llm/client';

  import CaseList from '$lib/components/CaseList.svelte';
  import CaseDetail from '$lib/components/CaseDetail.svelte';
  import type { CaseRecord, Evidence, CaseEvent } from '$lib/types/case';
  import type { CaseNormativeMatch, DocumentUseKey } from '$lib/types/normative';

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function makeEvent(caseId: string, type: string, label: string, notes = ''): CaseEvent {
    return {
      id: uid(),
      caseId,
      type,
      label,
      notes,
      createdAt: new Date().toISOString()
    };
  }

  function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function toPlain<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  let status = $state('Inicializando...');
  let debug = $state('');
  let cases = $state<CaseRecord[]>([]);
  let selectedCaseId = $state('');
  let selectedDocumentName = $state('');
  let selectedVariantKey = $state('institucional_estandar');
  let selectedLLMProvider = $state('gemini');

  let llmRefinedContent = $state('');
  let llmRefinedLoading = $state(false);
  let llmRefinedError = $state('');
  let llmRefinedProviderUsed = $state('');

  let llmReading = $state<any | null>(null);
  let llmReadingLoading = $state(false);
  let llmReadingError = $state('');
  let llmReadingProviderUsed = $state('');

  let normativeEvaluationLoading = $state(false);
  let normativeEvaluationError = $state('');
  let normativeEvaluationProviderUsed = $state('');
  let normativeMatchesOverride = $state<CaseNormativeMatch[] | null>(null);

  async function loadCases() {
    try {
      debug = 'Cargando casos con relaciones...';
      cases = await getAllCasesWithRelations();
      status = `Casos cargados: ${cases.length}`;
      debug = 'Carga completada';

      if (cases.length > 0 && !selectedCaseId) {
        selectedCaseId = cases[0].id;
      }

      if (selectedCaseId && !cases.some((c) => c.id === selectedCaseId)) {
        selectedCaseId = cases.length > 0 ? cases[0].id : '';
      }
    } catch (error) {
      console.error(error);
      status = 'Error al cargar casos';
      debug = error instanceof Error ? error.message : String(error);
    }
  }

  function resetLLMState() {
    llmRefinedContent = '';
    llmRefinedError = '';
    llmRefinedProviderUsed = '';
    llmReading = null;
    llmReadingError = '';
    llmReadingProviderUsed = '';
    normativeEvaluationError = '';
    normativeEvaluationProviderUsed = '';
    normativeMatchesOverride = null;
  }

  function selectCase(caseId: string) {
    selectedCaseId = caseId;
    resetLLMState();
  }

  function openCaseDemo() {
    if (cases.length > 0) {
      selectedCaseId = cases[0].id;
      resetLLMState();
      setTimeout(() => {
        scrollToSection('workspace');
      }, 50);
    }
  }

  async function handleDeleteCase(caseId: string) {
    const target = cases.find((c) => c.id === caseId);
    const label = target?.title || 'este caso';

    const confirmed = window.confirm(`¿Deseas eliminar ${label}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await deleteCase(caseId);

      if (selectedCaseId === caseId) {
        const remaining = cases.filter((c) => c.id !== caseId);
        selectedCaseId = remaining.length > 0 ? remaining[0].id : '';
      }

      resetLLMState();
      await loadCases();
    } catch (error) {
      console.error(error);
      status = 'Error al eliminar caso';
      debug = error instanceof Error ? error.message : String(error);
    }
  }

  function selectDocument(name: string) {
    selectedDocumentName = name;
    llmRefinedContent = '';
    llmRefinedError = '';
    llmRefinedProviderUsed = '';
  }

  function selectVariant(key: string) {
    selectedVariantKey = key;
    llmRefinedContent = '';
    llmRefinedError = '';
    llmRefinedProviderUsed = '';
  }

  function selectLLMProvider(provider: string) {
    selectedLLMProvider = provider;
    resetLLMState();
  }

  function exportDocument(name: string) {
    const doc = generatedDocuments.find((item) => item.name === name);
    if (!doc) return;

    const safeName = doc.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    downloadTextFile(`${safeName}.txt`, doc.content);
  }

  function exportVariant(key: string) {
    const variant = refinedVariants.find((item) => item.key === key);
    if (!variant) return;

    downloadTextFile(`${variant.key}.txt`, variant.content);
  }

  function exportLLMVariant() {
    if (!llmRefinedContent) return;

    const safeName = `${selectedVariantKey}_${llmRefinedProviderUsed || selectedLLMProvider}`
      .replace(/[^a-z0-9]+/gi, '_')
      .toLowerCase();

    downloadTextFile(`${safeName}_llm.txt`, llmRefinedContent);
  }

  async function runLLMRefine() {
    try {
      llmRefinedLoading = true;
      llmRefinedError = '';
      llmRefinedContent = '';
      llmRefinedProviderUsed = '';

      const baseDoc =
        generatedDocuments.find((doc) => doc.name === selectedDocumentName) ||
        generatedDocuments[0];

      const selectedVariant =
        refinedVariants.find((item) => item.key === selectedVariantKey) ||
        refinedVariants[0];

      if (!baseDoc || !selectedVariant || !currentCase) {
        llmRefinedError = 'No hay suficiente información para refinar el documento.';
        return;
      }

      const result = await refineWithLLM({
        provider: selectedLLMProvider,
        baseContent: baseDoc.content,
        options: {
          documentName: baseDoc.name,
          tone: selectedVariant.tone,
          audience: selectedVariant.audience,
          variant: selectedVariant.variant,
          caseData: currentCase,
          institutionRecommendation,
          operationalPrimaryCandidate,
          operationalSecondaryCandidates
        },
        safety_identifier: currentCase.id
      });

      llmRefinedContent = result.output || '';
      llmRefinedProviderUsed = result.provider || selectedLLMProvider;
    } catch (error) {
      console.error(error);
      llmRefinedError =
        error instanceof Error
          ? error.message
          : 'No se pudo refinar el documento con LLM.';
    } finally {
      llmRefinedLoading = false;
    }
  }

  async function runLLMReading() {
    try {
      if (!currentCase) {
        llmReadingError = 'No hay caso seleccionado.';
        return;
      }

      llmReadingLoading = true;
      llmReadingError = '';
      llmReading = null;
      llmReadingProviderUsed = '';

      const result = await enrichReadingWithLLM({
        provider: selectedLLMProvider,
        caseData: {
          title: currentCase.title,
          community: currentCase.community,
          location: currentCase.location,
          dateStarted: currentCase.dateStarted,
          problemType: currentCase.problemType,
          affectedPeople: currentCase.affectedPeople,
          status: currentCase.status,
          authorityContacted: currentCase.authorityContacted,
          authorityResponse: currentCase.authorityResponse,
          narrative: currentCase.narrative,
          evidence: currentCase.evidence
        },
        institutionRecommendation,
        safety_identifier: currentCase.id
      });

      llmReading = result.output || null;
      llmReadingProviderUsed = result.provider || selectedLLMProvider;
    } catch (error) {
      console.error(error);
      llmReadingError =
        error instanceof Error
          ? error.message
          : 'No se pudo enriquecer la lectura preliminar con LLM.';
    } finally {
      llmReadingLoading = false;
    }
  }

  async function runNormativeEvaluation() {
    try {
      if (!currentCase || !normativeAnalysis || candidateNorms.length === 0) {
        normativeEvaluationError = 'No hay caso o normas candidatas para valorar.';
        return;
      }

      normativeEvaluationLoading = true;
      normativeEvaluationError = '';
      normativeEvaluationProviderUsed = '';

      const prompt = buildNormativeEvaluationPrompt(
        currentCase,
        normativeAnalysis,
        candidateNorms
      );

      const result = await evaluateNormsWithLLM({
        provider: selectedLLMProvider,
        prompt,
        safety_identifier: currentCase.id
      });

      const aiOutput = (result.output || []) as NormativeAIEvaluation[];
      const currentMatches = currentCase.normativeMatches || [];

      const updatedMatches = aiOutput.map((item, index) => {
        const existing = currentMatches.find(
          (m) => m.normativeSourceId === item.normativeSourceId
        );

        return {
          id: existing?.id || `${currentCase.id}-ai-norm-${index + 1}`,
          caseId: currentCase.id,
          normativeSourceId: item.normativeSourceId,
          relevance: item.relevance,
          functionInCase: item.functionInCase,
          rationale: item.rationale,
          triggeringFact: item.triggeringFact,
          missingForStrongerUse: item.missingForStrongerUse,
          caution: item.caution,
          selectedForUse: existing?.selectedForUse || false,
          selectedForDocuments: existing?.selectedForDocuments
            ? [...existing.selectedForDocuments]
            : []
        };
      });

      const plainUpdatedMatches = toPlain(updatedMatches);
      normativeMatchesOverride = plainUpdatedMatches;
      normativeEvaluationProviderUsed = result.provider || selectedLLMProvider;
      await persistNormativeMatches(plainUpdatedMatches);
    } catch (error) {
      console.error(error);
      normativeEvaluationError =
        error instanceof Error
          ? error.message
          : 'No se pudieron valorar las normas con IA.';
    } finally {
      normativeEvaluationLoading = false;
    }
  }

  async function persistNormativeMatches(updatedMatches: CaseNormativeMatch[]) {
    if (!currentCase) return;

    const target = cases.find((c) => c.id === currentCase.id);
    if (!target) return;

    const plainMatches = toPlain(updatedMatches);

    target.normativeMatches = plainMatches;
    target.updatedAt = new Date().toISOString();

    normativeMatchesOverride = plainMatches;

    const plainTarget = toPlain(target);
    await saveCase(plainTarget);
    await loadCases();
    selectedCaseId = target.id;
  }

  async function toggleNormativeSelection(
    normativeSourceId: string,
    selected: boolean
  ) {
    const exists = normativeMatches.some(
      (match) => match.normativeSourceId === normativeSourceId
    );

    const baseMatches = exists
      ? normativeMatches
      : [
          ...normativeMatches,
          {
            id: `${currentCase?.id}-norm-added-${normativeSourceId}`,
            caseId: currentCase?.id || '',
            normativeSourceId,
            relevance: 'media',
            functionInCase: 'fundamento inicial',
            rationale: 'Coincidencia preliminar entre el contenido del caso y los temas de la norma.',
            triggeringFact:
              currentCase?.problemType || currentCase?.title || 'Hechos del caso',
            missingForStrongerUse:
              'Mayor precisión de hechos, autoridad competente y evidencia.',
            caution: 'Requiere validación contextual antes de uso más fuerte.',
            selectedForUse: false,
            selectedForDocuments: []
          }
        ];

    const updated = baseMatches.map((match) =>
      match.normativeSourceId === normativeSourceId
        ? {
            ...match,
            selectedForUse: selected,
            selectedForDocuments: selected ? [...match.selectedForDocuments] : []
          }
        : {
            ...match,
            selectedForDocuments: [...match.selectedForDocuments]
          }
    );

    await persistNormativeMatches(toPlain(updated));
  }

  async function toggleNormativeDocumentUse(
    normativeSourceId: string,
    documentUse: DocumentUseKey,
    selected: boolean
  ) {
    const exists = normativeMatches.some(
      (match) => match.normativeSourceId === normativeSourceId
    );

    const baseMatches = exists
      ? normativeMatches
      : [
          ...normativeMatches,
          {
            id: `${currentCase?.id}-norm-added-${normativeSourceId}`,
            caseId: currentCase?.id || '',
            normativeSourceId,
            relevance: 'media',
            functionInCase: 'fundamento inicial',
            rationale: 'Coincidencia preliminar entre el contenido del caso y los temas de la norma.',
            triggeringFact:
              currentCase?.problemType || currentCase?.title || 'Hechos del caso',
            missingForStrongerUse:
              'Mayor precisión de hechos, autoridad competente y evidencia.',
            caution: 'Requiere validación contextual antes de uso más fuerte.',
            selectedForUse: false,
            selectedForDocuments: []
          }
        ];

    const updated = baseMatches.map((match) => {
      if (match.normativeSourceId !== normativeSourceId) {
        return {
          ...match,
          selectedForDocuments: [...match.selectedForDocuments]
        };
      }

      const nextDocuments = selected
        ? [...new Set([...(match.selectedForDocuments || []), documentUse])]
        : (match.selectedForDocuments || []).filter((d) => d !== documentUse);

      return {
        ...match,
        selectedForUse: nextDocuments.length > 0 ? true : match.selectedForUse,
        selectedForDocuments: [...nextDocuments]
      };
    });

    await persistNormativeMatches(toPlain(updated));
  }

  async function createTestCase() {
    try {
      const newCase = createEmptyCase();
      newCase.title = `Caso de prueba ${cases.length + 1}`;
      newCase.community = 'Comunidad piloto';
      newCase.narrative =
        'Este es un caso inicial de prueba para verificar que IndexedDB funciona.';
      newCase.events.push({
        id: `evt_extra_${Date.now()}`,
        caseId: newCase.id,
        type: 'note',
        label: 'Evento de prueba',
        notes: 'Se creó el caso de prueba',
        createdAt: new Date().toISOString()
      });

      await saveCase(toPlain(newCase));
      await loadCases();
      selectedCaseId = newCase.id;
      resetLLMState();
    } catch (error) {
      console.error(error);
      status = 'Error al crear caso';
      debug = error instanceof Error ? error.message : String(error);
    }
  }

  async function updateCaseField(field: keyof CaseRecord, value: string) {
    const target = cases.find((c) => c.id === selectedCaseId);
    if (!target) return;

    const previousValue = String(target[field] ?? '');
    target[field] = value as never;
    target.updatedAt = new Date().toISOString();

    const fieldsWithEvents: (keyof CaseRecord)[] = [
      'status',
      'authorityContacted',
      'authorityResponse'
    ];

    if (fieldsWithEvents.includes(field) && previousValue !== value) {
      target.events = [
        makeEvent(
          target.id,
          'field_updated',
          `Campo actualizado: ${String(field)}`,
          `Antes: ${previousValue || '(vacío)'} | Ahora: ${value || '(vacío)'}`
        ),
        ...target.events
      ];
    }

    await saveCase(toPlain(target));
    await loadCases();
    selectedCaseId = target.id;
  }

  async function addEvidence() {
    const target = cases.find((c) => c.id === selectedCaseId);
    if (!target) return;

    const newEvidence: Evidence = {
      id: uid(),
      caseId: target.id,
      type: '',
      name: '',
      description: '',
      gps: '',
      date: '',
      fileName: '',
      fileType: '',
      fileData: ''
    };

    target.evidence = [...target.evidence, newEvidence];
    target.updatedAt = new Date().toISOString();
    target.events = [
      makeEvent(
        target.id,
        'evidence_added',
        'Evidencia añadida',
        'Se creó un nuevo registro de evidencia'
      ),
      ...target.events
    ];

    await saveCase(toPlain(target));
    await loadCases();
    selectedCaseId = target.id;
  }

  async function updateEvidence(
    evidenceId: string,
    field: keyof Evidence,
    value: string
  ) {
    const target = cases.find((c) => c.id === selectedCaseId);
    if (!target) return;

    const evidenceItem = target.evidence.find((e) => e.id === evidenceId);
    if (!evidenceItem) return;

    evidenceItem[field] = value as never;
    target.updatedAt = new Date().toISOString();
    target.events = [
      makeEvent(
        target.id,
        'evidence_updated',
        `Evidencia actualizada: ${String(field)}`,
        evidenceId
      ),
      ...target.events
    ];

    await saveCase(toPlain(target));
    await loadCases();
    selectedCaseId = target.id;
  }

  async function deleteEvidence(evidenceId: string) {
    const target = cases.find((c) => c.id === selectedCaseId);
    if (!target) return;

    target.evidence = target.evidence.filter((e) => e.id !== evidenceId);
    target.updatedAt = new Date().toISOString();
    target.events = [
      makeEvent(target.id, 'evidence_deleted', 'Evidencia eliminada', evidenceId),
      ...target.events
    ];

    await saveCase(toPlain(target));
    await loadCases();
    selectedCaseId = target.id;
  }

  async function uploadEvidenceFile(evidenceId: string, file: File) {
    const target = cases.find((c) => c.id === selectedCaseId);
    if (!target) return;

    const evidenceItem = target.evidence.find((e) => e.id === evidenceId);
    if (!evidenceItem) return;

    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.onerror = () => {
        reject(new Error('No se pudo leer el archivo.'));
      };

      reader.readAsDataURL(file);
    });

    evidenceItem.fileName = file.name;
    evidenceItem.fileType = file.type;
    evidenceItem.fileData = fileData;
    target.updatedAt = new Date().toISOString();
    target.events = [
      makeEvent(target.id, 'file_uploaded', 'Archivo adjuntado', file.name),
      ...target.events
    ];

    await saveCase(toPlain(target));
    await loadCases();
    selectedCaseId = target.id;
  }

  function mergeNormativeMatches(
    caseData: CaseRecord | null,
    candidateNorms: typeof normativeSeed
  ): CaseNormativeMatch[] {
    if (!caseData) return [];

    const persisted = caseData.normativeMatches || [];
    const persistedMap = new Map(
      persisted.map((m) => [m.normativeSourceId, m])
    );

    const generated = buildInitialNormativeMatches(caseData, candidateNorms);

    const merged = generated.map((gen) => {
      const old = persistedMap.get(gen.normativeSourceId);
      return old
        ? {
            ...gen,
            ...old,
            selectedForDocuments: [...(old.selectedForDocuments || [])]
          }
        : gen;
    });

    const generatedIds = new Set(generated.map((g) => g.normativeSourceId));
    const legacyOnly = persisted.filter(
      (p) => !generatedIds.has(p.normativeSourceId)
    );

    return [...merged, ...legacyOnly];
  }

  let currentCase = $derived(
    cases.find((c) => c.id === selectedCaseId) || null
  );

  let institutionRecommendation = $derived(
    currentCase ? recommendInstitution(currentCase) : null
  );

  let preliminaryReading = $derived(
    currentCase ? getPreliminaryReading(currentCase) : null
  );

  let suggestedDocuments = $derived(
    currentCase ? recommendDocuments(currentCase) : []
  );

  let generatedDocuments = $derived(
    currentCase
      ? buildGeneratedDocuments(
          currentCase,
          institutionRecommendation,
          suggestedDocuments,
          normativeSeed
        )
      : []
  );

  let refinedVariants = $derived(
    currentCase && generatedDocuments.length > 0
      ? buildRefinedDocumentVariants(
          generatedDocuments.find((doc) => doc.name === selectedDocumentName) ||
            generatedDocuments[0],
          currentCase,
          institutionRecommendation
        )
      : []
  );

  let normativeRetrieval = $derived(
    currentCase ? retrieveCandidateNorms(currentCase, normativeSeed) : null
  );

  let normativeAnalysis = $derived(
    normativeRetrieval ? normativeRetrieval.analysis : null
  );

  let candidateNorms = $derived(
    normativeRetrieval ? normativeRetrieval.candidates : []
  );

  let initialNormativeMatches = $derived(
    currentCase ? mergeNormativeMatches(currentCase, candidateNorms) : []
  );

  let normativeMatches = $derived(
    normativeMatchesOverride || initialNormativeMatches
  );

  let operationalResult = $derived(
    currentCase ? analyzeOperationalRoutes(currentCase, operationalSeed) : null
  );

  let operationalAnalysis = $derived(
    operationalResult ? operationalResult.analysis : null
  );

  let operationalPrimaryCandidate = $derived(
    operationalResult ? operationalResult.primaryCandidate : null
  );

  let operationalSecondaryCandidates = $derived(
    operationalResult ? operationalResult.secondaryCandidates : []
  );

  onMount(async () => {
    await loadCases();
  });
</script>

<svelte:head>
  <title>Copilota del Agua TDPS</title>
</svelte:head>

<div style="padding: 2rem; font-family: sans-serif;">
  <section
    style="
      margin-bottom: 2rem;
      padding: 2rem;
      border: 1px solid #d9e2ec;
      border-radius: 18px;
      background: linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%);
    "
  >
    <div style="max-width: 980px;">
      <div
        style="
          display: inline-block;
          margin-bottom: 0.75rem;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          background: #e8f1fb;
          font-size: 0.85rem;
          font-weight: 600;
        "
      >
        Prototipo para evaluación
      </div>

      <h1 style="margin: 0 0 0.75rem 0; font-size: 2.2rem; line-height: 1.15;">
        Copilota del Agua TDPS
      </h1>

      <p style="margin: 0 0 1rem 0; font-size: 1.1rem; max-width: 850px; line-height: 1.5;">
        Herramienta jurídico-comunitaria y de inteligencia artificial para fortalecer el
        liderazgo de mujeres indígenas del Lago Titicaca y subcuencas relevantes en la
        defensa del agua, el ambiente y sus derechos.
      </p>

      <p style="margin: 0 0 1.25rem 0; max-width: 860px; line-height: 1.55;">
        La aplicación permite registrar casos, organizar evidencia, sugerir rutas de acción,
        recuperar base normativa pertinente y generar documentos dirigidos a municipios,
        ALT y otras instituciones competentes.
      </p>

      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem;
          margin: 1.25rem 0 1.5rem 0;
        "
      >
        <div style="padding: 0.9rem 1rem; border-radius: 14px; background: white; border: 1px solid #dde7f0;">
          <div style="font-weight: 700; margin-bottom: 0.35rem;">1. Registrar casos</div>
          <div style="font-size: 0.95rem; line-height: 1.45;">
            Narrar hechos, ordenar información y consolidar evidencia comunitaria.
          </div>
        </div>

        <div style="padding: 0.9rem 1rem; border-radius: 14px; background: white; border: 1px solid #dde7f0;">
          <div style="font-weight: 700; margin-bottom: 0.35rem;">2. Activar rutas</div>
          <div style="font-size: 0.95rem; line-height: 1.45;">
            Identificar patrones operativos, instituciones probables y pasos de escalamiento.
          </div>
        </div>

        <div style="padding: 0.9rem 1rem; border-radius: 14px; background: white; border: 1px solid #dde7f0;">
          <div style="font-weight: 700; margin-bottom: 0.35rem;">3. Usar base jurídica</div>
          <div style="font-size: 0.95rem; line-height: 1.45;">
            Recuperar normas relevantes y asignarlas a documentos estratégicos.
          </div>
        </div>

        <div style="padding: 0.9rem 1rem; border-radius: 14px; background: white; border: 1px solid #dde7f0;">
          <div style="font-weight: 700; margin-bottom: 0.35rem;">4. Generar documentos</div>
          <div style="font-size: 0.95rem; line-height: 1.45;">
            Elaborar solicitudes, presentaciones y borradores listos para revisión.
          </div>
        </div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
        <button
          onclick={openCaseDemo}
          style="
            padding: 0.8rem 1.2rem;
            border: none;
            border-radius: 12px;
            background: #1f5fae;
            color: white;
            font-weight: 700;
            cursor: pointer;
          "
        >
          Ver caso demo
        </button>

        <button
          onclick={() => scrollToSection('workspace')}
          style="
            padding: 0.8rem 1.2rem;
            border: 1px solid #b8c7d8;
            border-radius: 12px;
            background: white;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Ir al expediente
        </button>

        <button
          onclick={() => scrollToSection('workspace')}
          style="
            padding: 0.8rem 1.2rem;
            border: 1px solid #b8c7d8;
            border-radius: 12px;
            background: white;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Marco normativo
        </button>

        <button
          onclick={() => scrollToSection('workspace')}
          style="
            padding: 0.8rem 1.2rem;
            border: 1px solid #b8c7d8;
            border-radius: 12px;
            background: white;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Documentos
        </button>
      </div>

      <div style="font-size: 0.92rem; color: #4d5b6a; line-height: 1.5;">
        Caso de demostración recomendado: contaminación de la Bahía de Cohana.
        Se sugiere explorar la ruta de acción, el marco normativo y la generación documental.
      </div>
    </div>
  </section>

  <p><strong>Estado:</strong> {status}</p>
  <p><strong>Debug:</strong> {debug}</p>

  <button onclick={createTestCase} style="margin-bottom: 1rem;">
    Crear caso de prueba
  </button>

  <div
    id="workspace"
    style="
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 2rem;
      align-items: start;
    "
  >
    <div style="border-right: 1px solid #ddd; padding-right: 1rem;">
      <CaseList
        {cases}
        {selectedCaseId}
        onSelectCase={selectCase}
        onDeleteCase={handleDeleteCase}
      />
    </div>

    <div>
      <CaseDetail
        caseData={currentCase}
        onUpdate={updateCaseField}
        onAddEvidence={addEvidence}
        onUpdateEvidence={updateEvidence}
        onDeleteEvidence={deleteEvidence}
        onUploadEvidenceFile={uploadEvidenceFile}
        {institutionRecommendation}
        {preliminaryReading}
        {suggestedDocuments}
        {generatedDocuments}
        selectedDocumentName={selectedDocumentName}
        onSelectDocument={selectDocument}
        onExportDocument={exportDocument}
        {refinedVariants}
        selectedVariantKey={selectedVariantKey}
        onSelectVariant={selectVariant}
        onExportVariant={exportVariant}
        selectedLLMProvider={selectedLLMProvider}
        onSelectLLMProvider={selectLLMProvider}
        llmRefinedContent={llmRefinedContent}
        llmRefinedLoading={llmRefinedLoading}
        llmRefinedError={llmRefinedError}
        llmRefinedProviderUsed={llmRefinedProviderUsed}
        onRunLLMRefine={runLLMRefine}
        onExportLLMVariant={exportLLMVariant}
        llmReading={llmReading}
        llmReadingLoading={llmReadingLoading}
        llmReadingError={llmReadingError}
        llmReadingProviderUsed={llmReadingProviderUsed}
        onRunLLMReading={runLLMReading}
        {normativeAnalysis}
        candidateNorms={candidateNorms}
        normativeMatches={normativeMatches}
        normativeEvaluationLoading={normativeEvaluationLoading}
        normativeEvaluationError={normativeEvaluationError}
        normativeEvaluationProviderUsed={normativeEvaluationProviderUsed}
        onRunNormativeEvaluation={runNormativeEvaluation}
        onToggleNormativeSelection={toggleNormativeSelection}
        onToggleNormativeDocumentUse={toggleNormativeDocumentUse}
        operationalAnalysis={operationalAnalysis}
        operationalPrimaryCandidate={operationalPrimaryCandidate}
        operationalSecondaryCandidates={operationalSecondaryCandidates}
      />
    </div>
  </div>
</div>