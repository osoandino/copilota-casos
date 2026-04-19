<script lang="ts">
  let {
    currentSection,
    onChange,
    completedSections = []
  }: {
    currentSection: string;
    onChange: (section: string) => void;
    completedSections?: string[];
  } = $props();

  // Los id DEBEN mantenerse exactos — CaseDetail los usa en sus bloques {#if}
  const sections = [
    { id: 'Narrar',          label: 'Narrar',        icon: '📝' },
    { id: 'Hechos',          label: 'Hechos',         icon: '📋' },
    { id: 'Evidencia',       label: 'Pruebas',        icon: '📷' },
    { id: 'Ruta de acción',  label: '¿Qué hacer?',   icon: '🧭' },
    { id: 'Marco normativo', label: 'Leyes',          icon: '⚖️' },
    { id: 'Documentos',      label: 'Mi carta',       icon: '📄' }
  ];

  function isDone(id: string)         { return completedSections.includes(id); }
  function isCurrent(id: string)      { return currentSection === id; }
  function prevIsDone(index: number)  { return index > 0 && completedSections.includes(sections[index - 1].id); }

  // Índice del paso actual para mostrar la etiqueta larga
  const currentIndex = $derived(sections.findIndex((s) => s.id === currentSection));
</script>

<div class="stepper-wrapper">
  <!-- Pasos con círculos y líneas conectoras -->
  <nav class="stepper" aria-label="Secciones del caso">
    {#each sections as section, i}
      <div
        class="step"
        class:done={isDone(section.id)}
        class:current={isCurrent(section.id)}
        class:prev-done={prevIsDone(i)}
      >
        <button
          class="circle"
          onclick={() => onChange(section.id)}
          aria-current={isCurrent(section.id) ? 'step' : undefined}
          aria-label="{i + 1}. {section.label}{isDone(section.id) ? ' — completado' : ''}"
          title="{section.label}"
        >
          {#if isDone(section.id)}
            ✓
          {:else}
            {i + 1}
          {/if}
        </button>

        <!-- Etiqueta corta debajo del círculo -->
        <button
          class="step-label"
          onclick={() => onChange(section.id)}
          tabindex="-1"
          aria-hidden="true"
        >
          {section.label}
        </button>
      </div>
    {/each}
  </nav>

  <!-- Indicador de sección activa con ícono y nombre largo -->
  <div class="active-indicator">
    <span class="active-icon">{sections[currentIndex]?.icon}</span>
    <span class="active-name">
      Paso {currentIndex + 1} de {sections.length} —
      <strong>{sections[currentIndex]?.label}</strong>
    </span>
    {#if currentIndex < sections.length - 1}
      <button class="next-btn" onclick={() => onChange(sections[currentIndex + 1].id)}>
        Siguiente →
      </button>
    {/if}
  </div>
</div>

<style>
  /* ── Contenedor principal ─────────────────────────────── */
  .stepper-wrapper {
    display: grid;
    gap: 0.6rem;
  }

  /* ── Fila de pasos ────────────────────────────────────── */
  .stepper {
    display: flex;
    align-items: flex-start;
    width: 100%;
    overflow-x: auto;
    padding: 4px 2px 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .stepper::-webkit-scrollbar { display: none; }

  /* ── Paso individual ──────────────────────────────────── */
  .step {
    flex: 1;
    min-width: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  /* Línea conectora: de centro del paso anterior al centro de este */
  .step:not(:first-child)::before {
    content: '';
    position: absolute;
    top: 15px;           /* mitad del círculo de 32px */
    left: -50%;
    right: 50%;
    height: 2px;
    background: #d0dae5;
    z-index: 0;
    transition: background 0.3s ease;
  }

  /* Línea azul si el paso anterior está completado */
  .step.prev-done::before {
    background: #1B5C8C;
  }

  /* ── Círculo del paso ─────────────────────────────────── */
  .circle {
    position: relative;
    z-index: 1;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #d0dae5;
    background: white;
    color: #9aafc2;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 1;
    transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .circle:hover { border-color: #5b8fb9; color: #5b8fb9; }
  .circle:focus-visible { box-shadow: 0 0 0 3px rgba(27, 92, 140, 0.3); }

  /* Paso activo */
  .step.current .circle {
    border-color: #1B5C8C;
    color: #1B5C8C;
    background: #e8f2fb;
    box-shadow: 0 0 0 4px rgba(27, 92, 140, 0.12);
  }

  /* Paso completado */
  .step.done .circle {
    background: #1B5C8C;
    border-color: #1B5C8C;
    color: white;
  }

  /* ── Etiqueta corta ───────────────────────────────────── */
  .step-label {
    margin-top: 5px;
    font-size: 10px;
    color: #9aafc2;
    text-align: center;
    line-height: 1.3;
    max-width: 60px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    word-break: break-word;
    hyphens: auto;
    transition: color 0.2s;
    font-family: inherit;
  }
  .step.current .step-label { color: #1B5C8C; font-weight: 600; }
  .step.done .step-label    { color: #1B5C8C; }
  .step-label:hover         { color: #5b8fb9; }

  /* ── Indicador activo (fila inferior) ─────────────────── */
  .active-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.85rem;
    background: #eef4fb;
    border: 1px solid #c4d9ee;
    border-radius: 12px;
    font-size: 0.87rem;
    color: #2c5f8a;
  }

  .active-icon { font-size: 1rem; flex-shrink: 0; }

  .active-name { flex: 1; }
  .active-name strong { color: #1B5C8C; }

  .next-btn {
    background: #1B5C8C;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.35rem 0.8rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    font-family: inherit;
  }
  .next-btn:hover { background: #154d78; }
</style>