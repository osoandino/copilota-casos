<script lang="ts">
  import { getDocumentName } from '$lib/config/documentRegistry';
  import { onMount } from 'svelte';
  import yanapaLogo from '$lib/assets/yanapa-red-logo.png';
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
    listCloudBackups,
    deleteCaseFromCloud
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

  function normalizeRelevance(value?: string): 'alta' | 'media' | 'baja' {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'alta') return 'alta';
    if (normalized === 'baja') return 'baja';
    return 'media';
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

  let cloudBackups = $state<any[]>([]);
  let cloudLoading = $state(false);
  let cloudError = $state('');

  // ── PIN de acceso ─────────────────────────────────────────────────────────
  const PIN_KEY = 'copilota_pin_hash';

  async function hashPin(pin: string): Promise<string> {
    const data = new TextEncoder().encode(pin + ':copilota-tdps-salt');
    const buf  = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Guarda protegido — localStorage solo existe en el navegador, no en SSR
  function storedHash(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(PIN_KEY) ?? '';
  }
  function pinIsSet(): boolean { return storedHash() !== ''; }

  // Empieza desbloqueado en SSR; onMount aplica el estado real en el cliente
  let pinUnlocked = $state(true);
  let pinMode     = $state<'unlock' | 'setup'>('setup');
  let pinInput    = $state('');
  let pinConfirm  = $state('');
  let pinError    = $state('');
  let pinLoading  = $state(false);

  async function handlePinSubmit() {
    pinError = '';
    if (pinInput.length < 4) { pinError = 'El PIN debe tener al menos 4 dígitos.'; return; }
    pinLoading = true;
    if (pinMode === 'setup') {
      if (pinInput !== pinConfirm) { pinError = 'Los PINs no coinciden.'; pinLoading = false; return; }
      const hash = await hashPin(pinInput);
      localStorage.setItem(PIN_KEY, hash);
      pinUnlocked = true;
    } else {
      const hash = await hashPin(pinInput);
      if (hash === storedHash()) {
        pinUnlocked = true;
      } else {
        pinError = 'PIN incorrecto. Intenta de nuevo.';
      }
    }
    pinInput = ''; pinConfirm = ''; pinLoading = false;
  }

  function lockApp() { pinUnlocked = false; pinInput = ''; pinConfirm = ''; pinError = ''; }

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

  async function deleteCloudCase(caseId: string, caseTitle: string) {
    const confirmed = confirm(
      `¿Eliminar de la nube el caso "${caseTitle || 'sin título'}"?\n\nEsta acción no elimina el caso de este dispositivo, solo de la nube.`
    );
    if (!confirmed) return;
    try {
      cloudLoading = true;
      cloudError = '';
      await deleteCaseFromCloud(caseId);
      cloudBackups = cloudBackups.filter((b) => b.id !== caseId);
      status = 'Caso eliminado de la nube';
      debug = caseId;
    } catch (error) {
      console.error(error);
      cloudError = errorToMessage(error);
    } finally {
      cloudLoading = false;
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
          // Se excluye fileData de cada evidencia — las imágenes base64 son
          // demasiado grandes para el payload y el API no las necesita
          evidence: (currentCase.evidence || []).map(({ fileData, ...rest }) => rest)
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

      const updatedMatches: CaseNormativeMatch[] = aiOutput.map((item, index) => {
        const existing = currentMatches.find(
          (m) => m.normativeSourceId === item.normativeSourceId
        );

        return {
          id: existing?.id || `${currentCase.id}-ai-norm-${index + 1}`,
          caseId: currentCase.id,
          normativeSourceId: item.normativeSourceId,
          relevance: normalizeRelevance(item.relevance),
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

    const plainMatches = toPlain(updatedMatches).map((match) => ({
      ...match,
      relevance: normalizeRelevance(match.relevance),
      selectedForDocuments: [...(match.selectedForDocuments || [])]
    })) as CaseNormativeMatch[];

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

    const baseMatches: CaseNormativeMatch[] = exists
      ? normativeMatches.map((match) => ({
          ...match,
          relevance: normalizeRelevance(match.relevance),
          selectedForDocuments: [...(match.selectedForDocuments || [])]
        }))
      : [
          ...normativeMatches.map((match) => ({
            ...match,
            relevance: normalizeRelevance(match.relevance),
            selectedForDocuments: [...(match.selectedForDocuments || [])]
          })),
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

    const updated: CaseNormativeMatch[] = baseMatches.map((match) =>
      match.normativeSourceId === normativeSourceId
        ? {
            ...match,
            relevance: normalizeRelevance(match.relevance),
            selectedForUse: selected,
            selectedForDocuments: selected ? [...match.selectedForDocuments] : []
          }
        : {
            ...match,
            relevance: normalizeRelevance(match.relevance),
            selectedForDocuments: [...match.selectedForDocuments]
          }
    );

    await persistNormativeMatches(updated);
  }

  async function toggleNormativeDocumentUse(
    normativeSourceId: string,
    documentUse: DocumentUseKey,
    selected: boolean
  ) {
    const exists = normativeMatches.some(
      (match) => match.normativeSourceId === normativeSourceId
    );

    const baseMatches: CaseNormativeMatch[] = exists
      ? normativeMatches.map((match) => ({
          ...match,
          relevance: normalizeRelevance(match.relevance),
          selectedForDocuments: [...(match.selectedForDocuments || [])]
        }))
      : [
          ...normativeMatches.map((match) => ({
            ...match,
            relevance: normalizeRelevance(match.relevance),
            selectedForDocuments: [...(match.selectedForDocuments || [])]
          })),
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

    const updated: CaseNormativeMatch[] = baseMatches.map((match) => {
      if (match.normativeSourceId !== normativeSourceId) {
        return {
          ...match,
          relevance: normalizeRelevance(match.relevance),
          selectedForDocuments: [...match.selectedForDocuments]
        };
      }

      const nextDocuments = selected
        ? [...new Set([...(match.selectedForDocuments || []), documentUse])]
        : (match.selectedForDocuments || []).filter((d) => d !== documentUse);

      return {
        ...match,
        relevance: normalizeRelevance(match.relevance),
        selectedForUse: nextDocuments.length > 0 ? true : match.selectedForUse,
        selectedForDocuments: [...nextDocuments]
      };
    });

    await persistNormativeMatches(updated);
  }

  async function createTestCase() {
    try {
      const newCase = createEmptyCase();
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
      whatItShows: '',
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

  // Mapa de timers por campo — evita guardar en IndexedDB en cada tecla.
  // Espera 400ms de pausa antes de persistir. Los selects y chips guardan inmediatamente.
  const _debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  const TEXT_FIELDS = new Set(['title', 'narrative', 'community', 'location', 'affectedPeople', 'dateStarted', 'problemType']);

  async function handleCaseUpdate(field: string, value: string) {
    // Actualización optimista en memoria — la UI responde sin esperar a IndexedDB
    const target = cases.find((c) => c.id === selectedCaseId);
    if (target) {
      target[field as keyof CaseRecord] = value as never;
      target.updatedAt = new Date().toISOString();
    }

    if (TEXT_FIELDS.has(field)) {
      // Campos de texto: debounce de 400ms
      clearTimeout(_debounceTimers[field]);
      _debounceTimers[field] = setTimeout(async () => {
        await updateCaseField(field as keyof CaseRecord, value);
      }, 400);
    } else {
      // Selects, chips y campos especiales: guardan de inmediato
      await updateCaseField(field as keyof CaseRecord, value);
    }
  }

  const _evidenceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  const EVIDENCE_TEXT_FIELDS = new Set(['name', 'description', 'whatItShows', 'gps', 'date']);

  async function handleEvidenceUpdate(
    evidenceId: string,
    field: string,
    value: string
  ) {
    // Actualización optimista en memoria
    const target = cases.find((c) => c.id === selectedCaseId);
    const evItem = target?.evidence?.find((e) => e.id === evidenceId);
    if (evItem) evItem[field as keyof Evidence] = value as never;

    if (EVIDENCE_TEXT_FIELDS.has(field)) {
      const key = `${evidenceId}:${field}`;
      clearTimeout(_evidenceTimers[key]);
      _evidenceTimers[key] = setTimeout(async () => {
        await updateEvidence(evidenceId, field as keyof Evidence, value);
      }, 400);
    } else {
      await updateEvidence(evidenceId, field as keyof Evidence, value);
    }
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
            relevance: normalizeRelevance(old.relevance),
            selectedForDocuments: [...(old.selectedForDocuments || [])]
          }
        : {
            ...gen,
            relevance: normalizeRelevance(gen.relevance),
            selectedForDocuments: [...(gen.selectedForDocuments || [])]
          };
    });

    const generatedIds = new Set(generated.map((g) => g.normativeSourceId));
    const legacyOnly = persisted
      .filter((p) => !generatedIds.has(p.normativeSourceId))
      .map((p) => ({
        ...p,
        relevance: normalizeRelevance(p.relevance),
        selectedForDocuments: [...(p.selectedForDocuments || [])]
      }));

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
      name: getDocumentName(key),
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
    // Inicializa el estado del PIN ahora que estamos en el cliente (localStorage disponible)
    if (pinIsSet()) {
      pinUnlocked = false;
      pinMode     = 'unlock';
    } else {
      pinUnlocked = false;   // muestra la pantalla de setup la primera vez
      pinMode     = 'setup';
    }

    await loadCases();
  });
</script>

<svelte:head>
  <title>Yanapa Red</title>
</svelte:head>

<div style="padding: 2rem; font-family: sans-serif;">

  <!-- ── Pantalla de PIN ─────────────────────────────────────────────────── -->
  {#if !pinUnlocked}
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #0D3F5F 0%, #1B5C8C 100%);
      z-index: 9999;
      padding: 1.5rem;
    ">
      <div style="
        background: white;
        border-radius: 24px;
        padding: 2rem 2rem 1.8rem;
        width: 100%;
        max-width: 360px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.25);
        text-align: center;
      ">
        <!-- Logo / título -->
        <div style="font-size: 2.2rem; margin-bottom: 0.3rem;">🔐</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: #14202b; margin-bottom: 0.25rem;">
          Yanapa Red
        </div>
        <div style="font-size: 0.9rem; color: #607386; margin-bottom: 1.6rem;">
          {#if pinMode === 'setup'}
            Crea un PIN de acceso para proteger tus casos
          {:else}
            Ingresa tu PIN para continuar
          {/if}
        </div>

        <!-- Campo PIN -->
        <div style="margin-bottom: 0.85rem;">
          <input
            type="password"
            inputmode="numeric"
            maxlength="8"
            placeholder={pinMode === 'setup' ? 'Elige un PIN (4–8 dígitos)' : 'Tu PIN'}
            bind:value={pinInput}
            onkeydown={(e) => e.key === 'Enter' && !pinLoading && handlePinSubmit()}
            style="
              width: 100%;
              padding: 0.85rem 1rem;
              border: 2px solid {pinError ? '#e57373' : '#cfd8e3'};
              border-radius: 14px;
              font-size: 1.1rem;
              letter-spacing: 0.25em;
              text-align: center;
              outline: none;
              font-family: monospace;
              box-sizing: border-box;
              transition: border-color 0.15s;
            "
          />
        </div>

        <!-- Confirmar PIN (solo en setup) -->
        {#if pinMode === 'setup'}
          <div style="margin-bottom: 0.85rem;">
            <input
              type="password"
              inputmode="numeric"
              maxlength="8"
              placeholder="Confirma tu PIN"
              bind:value={pinConfirm}
              onkeydown={(e) => e.key === 'Enter' && !pinLoading && handlePinSubmit()}
              style="
                width: 100%;
                padding: 0.85rem 1rem;
                border: 2px solid {pinError ? '#e57373' : '#cfd8e3'};
                border-radius: 14px;
                font-size: 1.1rem;
                letter-spacing: 0.25em;
                text-align: center;
                outline: none;
                font-family: monospace;
                box-sizing: border-box;
              "
            />
          </div>
        {/if}

        <!-- Error -->
        {#if pinError}
          <div style="
            color: #b42318;
            font-size: 0.88rem;
            margin-bottom: 0.8rem;
            padding: 0.5rem 0.75rem;
            background: #fff5f5;
            border-radius: 10px;
            border: 1px solid #f3b3b3;
          ">
            {pinError}
          </div>
        {/if}

        <!-- Botón -->
        <button
          onclick={handlePinSubmit}
          disabled={pinLoading}
          style="
            width: 100%;
            padding: 0.85rem;
            background: #1B5C8C;
            color: white;
            border: none;
            border-radius: 14px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            opacity: {pinLoading ? '0.7' : '1'};
          "
        >
          {#if pinLoading}
            Verificando…
          {:else if pinMode === 'setup'}
            Crear PIN y entrar
          {:else}
            Entrar
          {/if}
        </button>

        <!-- Nota de ayuda -->
        <div style="font-size: 0.78rem; color: #9aafc2; margin-top: 1rem; line-height: 1.5;">
          {#if pinMode === 'setup'}
            Este PIN protege el acceso en este dispositivo.<br>
            Guárdalo en un lugar seguro — no se puede recuperar.
          {:else}
            Si olvidaste tu PIN, contacta a la administradora.
          {/if}
        </div>
      </div>
    </div>
  {:else}
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
          Yanapa Red
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
          Suma Jakaña — Vivir Bien. Registra casos, organiza evidencia, activa rutas de acción
          y genera documentos para defender tu territorio y tu agua.
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
            src={yanapaLogo}
            alt="Yanapa Red — Suma Jakaña"
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
      Crear caso
    </button>

    <button onclick={backupCurrentCase} disabled={!currentCase}>
      Guardar en nube
    </button>

    <button onclick={loadCloudBackups} disabled={cloudLoading}>
      {cloudLoading ? 'Cargando casos...' : 'Ver casos en nube'}
    </button>

    <button
      onclick={lockApp}
      style="
        margin-left: auto;
        background: #f5f5f5;
        border: 1px solid #d0d8e0;
        border-radius: 10px;
        padding: 0.5rem 0.9rem;
        font-size: 0.9rem;
        cursor: pointer;
        font-family: inherit;
      "
    >
      🔒 Bloquear
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
      <h3 style="margin-top: 0;">Casos guardados en la nube</h3>

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
              flex-wrap: wrap;
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

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button onclick={() => restoreSelectedCloudCase(backup.id)}>
                Recuperar este caso
              </button>
              <button
                onclick={() => deleteCloudCase(backup.id, backup.title)}
                style="
                  background: #fff5f5;
                  color: #b42318;
                  border: 1px solid #f3b3b3;
                  border-radius: 10px;
                  padding: 0.5rem 0.85rem;
                  font-weight: 700;
                  font-size: 0.92rem;
                  cursor: pointer;
                "
              >
                Eliminar de la nube
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ── Pantalla de bienvenida (solo cuando no hay casos) ── -->
  {#if cases.length === 0}
    <div
      style="
        margin-bottom: 2rem;
        padding: 1.8rem 2rem;
        border: 1px solid #c4d9ee;
        border-radius: 22px;
        background: linear-gradient(135deg, #0D3F5F 0%, #1B5C8C 100%);
        color: white;
      "
    >
      <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.4rem;">
        Bienvenida a Yanapa Red 👋
      </div>
      <div style="font-size: 1rem; opacity: 0.88; line-height: 1.6; margin-bottom: 1.4rem; max-width: 560px;">
        Yanapa Red — Suma Jakaña — te ayuda a documentar casos de daño ambiental
        en el sistema TDPS y a encontrar la mejor forma de defenderte. Puedes
        registrar el problema, agregar pruebas, identificar las leyes que te
        protegen y generar cartas o solicitudes listas para presentar.
      </div>

      <!-- Pasos rápidos -->
      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.6rem;
        "
      >
        {#each [
          { n: '1', icon: '📝', txt: 'Cuenta qué ocurrió' },
          { n: '2', icon: '📋', txt: 'Registra los hechos' },
          { n: '3', icon: '📷', txt: 'Agrega pruebas' },
          { n: '4', icon: '🧭', txt: 'Descubre qué hacer' },
          { n: '5', icon: '⚖️', txt: 'Ve las leyes que te protegen' },
          { n: '6', icon: '📄', txt: 'Genera tu carta' },
        ] as step}
          <div
            style="
              display: flex;
              align-items: flex-start;
              gap: 0.6rem;
              background: rgba(255,255,255,0.10);
              border: 1px solid rgba(255,255,255,0.20);
              border-radius: 12px;
              padding: 0.65rem 0.8rem;
            "
          >
            <span style="font-size: 1.1rem; flex-shrink: 0;">{step.icon}</span>
            <div>
              <div style="font-size: 0.72rem; opacity: 0.65; font-weight: 600; margin-bottom: 1px;">
                Paso {step.n}
              </div>
              <div style="font-size: 0.88rem; font-weight: 600; line-height: 1.3;">
                {step.txt}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Tip -->
      <div
        style="
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 12px;
          padding: 0.7rem 1rem;
          font-size: 0.9rem;
          line-height: 1.55;
          margin-bottom: 1.5rem;
          max-width: 560px;
        "
      >
        💡 <strong>Consejo:</strong> Puedes avanzar y volver entre los pasos en cualquier momento.
        Los cambios se guardan automáticamente.
      </div>

      <!-- Botón principal -->
      <button
        onclick={createTestCase}
        style="
          background: white;
          color: #1B5C8C;
          border: none;
          border-radius: 14px;
          padding: 0.85rem 2rem;
          font-size: 1.05rem;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.15s;
        "
        onmouseenter={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'}
        onmouseleave={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
      >
        Crear mi primer caso →
      </button>
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
        onUpdate={handleCaseUpdate}
        onAddEvidence={addEvidence}
        onUpdateEvidence={handleEvidenceUpdate}
        onDeleteEvidence={deleteEvidence}
        onUploadEvidenceFile={uploadEvidenceFile}
        {institutionRecommendation}
        preliminaryReading={preliminaryReading as any}
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

  {/if}
</div>