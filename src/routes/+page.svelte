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

  import {
    backupCaseToCloud,
    restoreCaseFromCloud,
    listCloudBackups
  } from '$lib/cloud/caseBackup';

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

  function errorToMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) return JSON.stringify(error);
    return String(error);
  }

  const documentNameMap: Record<string, string> = {
    ficha_resumen: 'Ficha resumen del caso',
    solicitud_inspeccion: 'Solicitud de inspección',
    solicitud_informacion: 'Solicitud de información',
    nota_seguimiento: 'Nota de seguimiento',
    acta_comunitaria: 'Acta comunitaria',
    cronologia: 'Cronología',
    presentacion_alt: 'Presentación a la ALT',
    presentacion_defensoria: 'Presentación a la Defensoría del Pueblo'
  };

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

  let cloudBackups = $state<any[]>([]);
  let cloudLoading = $state(false);
  let cloudError = $state('');

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
      debug = errorToMessage(error);
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
      debug = errorToMessage(error);
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

  async function backupCurrentCase() {
    try {
      if (!currentCase) return;

      await backupCaseToCloud(toPlain(currentCase));
      status = 'Caso respaldado en nube';
      debug = `Respaldo remoto exitoso: ${currentCase.title || currentCase.id}`;
    } catch (error) {
      console.error(error);
      status = 'Error al respaldar en nube';
      debug = errorToMessage(error);
    }
  }

  async function restoreCurrentCase() {
    try {
      if (!currentCase) return;

      const remoteCase = await restoreCaseFromCloud(currentCase.id);

      if (!remoteCase) {
        status = 'No existe respaldo remoto para este caso';
        debug = currentCase.id;
        return;
      }

      await saveCase(toPlain(remoteCase));
      await loadCases();
      selectedCaseId = remoteCase.id;

      status = 'Caso recuperado desde nube';
      debug = `Recuperado: ${remoteCase.title || remoteCase.id}`;
    } catch (error) {
      console.error(error);
      status = 'Error al recuperar desde nube';
      debug = errorToMessage(error);
    }
  }

  async function loadCloudBackups() {
    try {
      cloudLoading = true;
      cloudError = '';
      cloudBackups = await listCloudBackups();

      status = 'Respaldos remotos cargados';
      debug = `Se encontraron ${cloudBackups.length} respaldo(s) en nube`;
    } catch (error) {
      console.error(error);
      const message = errorToMessage(error);
      cloudError = message;
      status = 'Error al cargar respaldos remotos';
      debug = message;
    } finally {
      cloudLoading = false;
    }
  }

  async function restoreSelectedCloudCase(caseId: string) {
    try {
      const remoteCase = await restoreCaseFromCloud(caseId);

      if (!remoteCase) {
        status = 'No existe respaldo remoto para ese caso';
        debug = caseId;
        return;
      }

      await saveCase(toPlain(remoteCase));
      await loadCases();
      selectedCaseId = remoteCase.id;

      status = 'Caso recuperado desde nube';
      debug = `Recuperado: ${remoteCase.title || remoteCase.id}`;
    } catch (error) {
      console.error(error);
      status = 'Error al recuperar desde nube';
      debug = errorToMessage(error);
    }
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
      debug = errorToMessage(error);
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

  let routeSuggestedDocuments = $derived(
    currentCase ? recommendDocuments(currentCase) : []
  );

  let documentsActivatedByNorms = $derived(
    [
      ...new Set(
        (normativeMatches || [])
          .filter(
            (match) =>
              !!match.selectedForUse || (match.selectedForDocuments || []).length > 0
          )
          .flatMap((match) => match.selectedForDocuments || [])
      )
    ]
  );

  let normativeSuggestedDocuments = $derived(
    documentsActivatedByNorms.map((key) => ({
      name: documentNameMap[key] || key,
      why: 'Activado por normas seleccionadas en el marco normativo.'
    }))
  );

  let suggestedDocuments = $derived.by(() => {
    const base = [
      {
        name: 'Ficha resumen del caso',
        why: 'Documento base del expediente.'
      }
    ];

    const combined = [
      ...base,
      ...routeSuggestedDocuments,
      ...normativeSuggestedDocuments
    ];

    const seen = new Set<string>();

    return combined.filter((doc) => {
      if (seen.has(doc.name)) return false;
      seen.add(doc.name);
      return true;
    });
  });

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
      padding: clamp(1.5rem, 2.2vw, 2.8rem);
      border: 1px solid #dbe6ef;
      border-radius: 28px;
      background:
        radial-gradient(circle at top right, rgba(54, 116, 181, 0.08), transparent 28%),
        linear-gradient(180deg, #f8fbff 0%, #eef4f9 100%);
      box-shadow: 0 18px 48px rgba(33, 52, 79, 0.08);
    "
  >
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2.2rem;
        align-items: center;
      "
    >
      <div style="min-width: 0;">
        <div
          style="
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            margin-bottom: 1rem;
            padding: 0.48rem 0.9rem;
            border-radius: 999px;
            background: rgba(31, 95, 174, 0.08);
            color: #184a86;
            font-size: 0.84rem;
            font-weight: 700;
            letter-spacing: 0.01em;
          "
        >
          <span
            style="
              width: 8px;
              height: 8px;
              border-radius: 999px;
              background: #1f5fae;
              display: inline-block;
            "
          ></span>
          Prototipo para evaluación
        </div>

        <h1
          style="
            margin: 0 0 1rem 0;
            font-size: clamp(2.2rem, 5vw, 3.4rem);
            line-height: 1.02;
            letter-spacing: -0.045em;
            color: #0f1720;
          "
        >
          Copilota del Agua TDPS
        </h1>

        <p
          style="
            margin: 0 0 1rem 0;
            font-size: clamp(1.03rem, 2vw, 1.18rem);
            line-height: 1.58;
            color: #223244;
            max-width: 820px;
          "
        >
          Herramienta jurídico-comunitaria e inteligencia artificial para fortalecer
          la defensa del agua, el ambiente y los derechos de mujeres indígenas del
          sistema Titicaca–Desaguadero–Poopó–Salar de Coipasa.
        </p>

        <p
          style="
            margin: 0;
            font-size: 1rem;
            line-height: 1.72;
            color: #526273;
            max-width: 760px;
          "
        >
          Permite registrar casos, organizar evidencia, activar rutas de acción,
          recuperar base normativa y generar documentos dirigidos a instituciones
          competentes.
        </p>
      </div>

      <div style="min-width: 0;">
        <div
          style="
            display: flex;
            justify-content: center;
            align-items: center;
            padding: clamp(1.2rem, 2vw, 1.8rem);
            border-radius: 24px;
            border: 1px solid #dfe8f1;
            background: rgba(255, 255, 255, 0.92);
            box-shadow: 0 16px 36px rgba(26, 42, 67, 0.08);
            min-height: 340px;
            position: relative;
            overflow: hidden;
          "
        >
          <div
            style="
              position: absolute;
              top: -34px;
              right: -34px;
              width: 120px;
              height: 120px;
              border-radius: 999px;
              background: rgba(31, 95, 174, 0.06);
            "
          ></div>

          <div
            style="
              position: absolute;
              bottom: -42px;
              left: -42px;
              width: 140px;
              height: 140px;
              border-radius: 999px;
              background: rgba(79, 146, 99, 0.06);
            "
          ></div>

          <img
            src="/logo-copilota.png"
            alt="Logo de la Copilota del Agua TDPS"
            style="
              position: relative;
              max-width: 100%;
              width: min(330px, 100%);
              height: auto;
              object-fit: contain;
              display: block;
              filter: drop-shadow(0 10px 18px rgba(15, 23, 32, 0.10));
            "
          />
        </div>
      </div>
    </div>
  </section>

  <p><strong>Estado:</strong> {status}</p>
  <p><strong>Debug:</strong> {debug}</p>

  <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
    <button onclick={createTestCase}>
      Crear caso de prueba
    </button>

    <button onclick={backupCurrentCase} disabled={!currentCase}>
      Respaldar en nube
    </button>

    <button onclick={restoreCurrentCase} disabled={!currentCase}>
      Recuperar desde nube
    </button>

    <button onclick={loadCloudBackups} disabled={cloudLoading}>
      {cloudLoading ? 'Cargando respaldos...' : 'Ver respaldos en nube'}
    </button>
  </div>

  {#if cloudError}
    <p><strong>Error nube:</strong> {cloudError}</p>
  {/if}

  {#if cloudBackups.length > 0}
    <div
      style="
        margin-bottom: 1.5rem;
        padding: 1rem;
        border: 1px solid #dbe6ef;
        border-radius: 16px;
        background: #f8fbff;
      "
    >
      <h3 style="margin-top: 0;">Respaldos en nube</h3>

      <div style="display: grid; gap: 0.75rem;">
        {#each cloudBackups as backup}
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 1rem;
              padding: 0.75rem;
              border: 1px solid #d9e2ec;
              border-radius: 12px;
              background: white;
            "
          >
            <div>
              <div style="font-weight: 700;">
                {backup.title || 'Caso sin título'}
              </div>
              <div style="font-size: 0.95rem; color: #5f7286;">
                Comunidad: {backup.community || '—'}
              </div>
              <div style="font-size: 0.9rem; color: #6b7c8d;">
                Actualizado: {backup.updated_at || '—'}
              </div>
            </div>

            <button onclick={() => restoreSelectedCloudCase(backup.id)}>
              Recuperar este caso
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

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