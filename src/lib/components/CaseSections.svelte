<script lang="ts">
  let {
    currentSection,
    onChange
  }: {
    currentSection: string;
    onChange: (section: string) => void;
  } = $props();

  const sections = [
    { id: 'Narrar', label: '1. Narrar' },
    { id: 'Hechos', label: '2. Hechos' },
    { id: 'Evidencia', label: '3. Evidencia' },
    { id: 'Ruta de acción', label: '4. Ruta de acción' },
    { id: 'Marco normativo', label: '5. Marco normativo' },
    { id: 'Documentos', label: '6. Documentos' }
  ];
</script>

<div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
  {#each sections as section}
    <button
      onclick={() => onChange(section.id)}
      style={`
        padding: 0.7rem 1rem;
        border-radius: 12px;
        border: 1px solid #cfd8e3;
        cursor: pointer;
        background: ${currentSection === section.id ? '#d9e4f2' : '#f3f4f6'};
        font-weight: ${currentSection === section.id ? '700' : '500'};
      `}
    >
      {section.label}
    </button>
  {/each}
</div>