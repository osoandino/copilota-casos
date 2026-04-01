<script lang="ts">
  let {
    currentSection,
    onChange
  }: {
    currentSection: string;
    onChange: (section: string) => void;
  } = $props();

  const sections = [
    'Narrar',
    'Hechos',
    'Evidencia',
    'Seguimiento',
    'Bitácora',
    'Ruta de acción',
    'Marco normativo',
    'Documentos',
    'Refinamiento IA'
  ];
</script>

<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
  {#each sections as section}
    <button
      onclick={() => onChange(section)}
      style={`
        padding: 0.5rem 0.75rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
        cursor: pointer;
        background: ${currentSection === section ? '#e5e7eb' : 'white'};
      `}
    >
      {section}
    </button>
  {/each}
</div>