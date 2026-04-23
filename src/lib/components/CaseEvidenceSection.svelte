<script lang="ts">
  type EvidenceItem = {
    id: string;
    type?: string;
    name?: string;
    description?: string;
    whatItShows?: string;
    gps?: string;
    date?: string;
    fileName?: string;
    fileType?: string;
    fileData?: string;
  };

  type CaseData = {
    evidence?: EvidenceItem[];
  } | null;

  const evidenceTypeOptions = [
    'Fotografía',
    'Video',
    'Audio',
    'Testimonio',
    'Documento oficial',
    'Documento comunitario',
    'Acta',
    'Mapa / croquis',
    'Registro GPS',
    'Informe técnico',
    'Muestra / análisis',
    'Otro'
  ];

  let {
    caseData,
    onAddEvidence,
    onUpdateEvidence,
    onDeleteEvidence,
    onUploadEvidenceFile
    }: {
    caseData: CaseData;
    onAddEvidence: () => void;
    onUpdateEvidence: (evidenceId: string, field: string, value: string) => void;
    onDeleteEvidence: (evidenceId: string) => void;
    onUploadEvidenceFile: (evidenceId: string, file: File) => void;
    } = $props();

  function assessEvidenceItem(e: EvidenceItem) {
    const missing: string[] = [];

    if (!(e.type || e.name)) {
      missing.push('tipo o nombre de referencia');
    }

    if (!e.description) {
      missing.push('descripción');
    }

    if (!e.whatItShows) {
      missing.push('qué demuestra');
    }

    if (!(e.date || e.gps || e.fileName)) {
      missing.push('fecha, GPS o archivo de respaldo');
    }

    let status: 'sólida' | 'parcial' | 'débil' = 'sólida';
    if (missing.length === 1) status = 'parcial';
    if (missing.length >= 2) status = 'débil';

    return { missing, status };
  }

  function getStatusStyles(status: 'sólida' | 'parcial' | 'débil') {
    if (status === 'sólida') {
      return {
        background: '#eaf7ee',
        border: '#b9e1c1',
        color: '#1f6b35'
      };
    }

    if (status === 'parcial') {
      return {
        background: '#fff8e8',
        border: '#efd99a',
        color: '#8a6412'
      };
    }

    return {
      background: '#fdeeee',
      border: '#e8b8b8',
      color: '#9a2f2f'
    };
  }

  function evidenceSummary() {
    const evidence = caseData?.evidence || [];
    const assessed = evidence.map((e) => assessEvidenceItem(e));

    return {
      total: evidence.length,
      solid: assessed.filter((a) => a.status === 'sólida').length,
      partial: assessed.filter((a) => a.status === 'parcial').length,
      weak: assessed.filter((a) => a.status === 'débil').length
    };
  }

  function packageReadiness() {
    const summary = evidenceSummary();

    if (summary.total === 0) {
      return {
        level: 'débil' as const,
        title: 'Expediente todavía sin base de evidencia',
        message:
          'Aún no hay evidencia registrada. Antes de generar un paquete fuerte, conviene incorporar al menos una referencia clara, una descripción, qué demuestra y algún respaldo temporal, espacial o documental.'
      };
    }

    if (summary.solid === summary.total) {
      return {
        level: 'lista' as const,
        title: 'Expediente con base de evidencia razonablemente sólida',
        message:
          'La evidencia registrada tiene un nivel útil de completitud para sostener mejor el paquete de evidencia, aunque siempre puede fortalecerse con mayor precisión.'
      };
    }

    if (summary.solid >= Math.ceil(summary.total / 2)) {
      return {
        level: 'intermedia' as const,
        title: 'Expediente usable, pero todavía reforzable',
        message:
          'Ya existe una base de evidencia útil, pero varias piezas todavía necesitan completar descripción, qué demuestra, fecha, GPS o archivo de respaldo para fortalecer una presentación institucional.'
      };
    }

    return {
      level: 'débil' as const,
      title: 'Expediente todavía débil para un paquete de evidencia fuerte',
      message:
        'La mayor parte de la evidencia aún es parcial o débil. Conviene completar metadatos, valor probatorio y soportes antes de usar el paquete como respaldo principal.'
      };
  }

  function packageReadinessStyles(level: 'lista' | 'intermedia' | 'débil') {
    if (level === 'lista') {
      return {
        background: '#edf8f0',
        border: '#b9e1c1',
        color: '#1f6b35'
      };
    }

    if (level === 'intermedia') {
      return {
        background: '#fff8e9',
        border: '#efd99a',
        color: '#8a6412'
      };
    }

    return {
      background: '#fdeeee',
      border: '#e8b8b8',
      color: '#9a2f2f'
    };
  }

  function evidenceTypeHelp(type?: string) {
    const t = (type || '').toLowerCase();

    if (t === 'fotografía') {
      return 'Describe qué se ve, desde dónde fue tomada y qué parte del problema permite constatar.';
    }

    if (t === 'video') {
      return 'Aclara qué registra el video, su duración aproximada y qué hecho permite observar.';
    }

    if (t === 'audio') {
      return 'Indica quién habla o qué se escucha y por qué ese audio es relevante para el caso.';
    }

    if (t === 'testimonio') {
      return 'Resume quién testimonia, qué observó directamente y qué parte del caso ayuda a confirmar.';
    }

    if (t === 'documento oficial') {
      return 'Identifica entidad emisora, fecha y qué aspecto institucional o técnico acredita.';
    }

    if (t === 'documento comunitario') {
      return 'Explica quién lo elaboró, en qué contexto y qué hecho o decisión comunitaria respalda.';
    }

    if (t === 'acta') {
      return 'Aclara fecha, participantes y qué acuerdo, constatación o mandato deja asentado.';
    }

    if (t === 'mapa / croquis') {
      return 'Describe qué ubica o delimita y cómo ayuda a entender espacialmente el caso.';
    }

    if (t === 'registro gps') {
      return 'Indica qué punto marca y por qué esa ubicación es importante dentro del expediente.';
    }

    if (t === 'informe técnico') {
      return 'Resume qué evaluó el informe, quién lo elaboró y qué conclusión útil aporta.';
    }

    if (t === 'muestra / análisis') {
      return 'Describe qué se tomó o analizó, cuándo y qué resultado o indicio relevante aporta.';
    }

    return 'Precisa qué contiene esta evidencia y cómo fortalece el caso.';
  }
</script>

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

  <div
    style={`
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid ${packageReadinessStyles(packageReadiness().level).border};
      border-radius: 16px;
      background: ${packageReadinessStyles(packageReadiness().level).background};
      color: ${packageReadinessStyles(packageReadiness().level).color};
    `}
  >
    <div style="font-weight: 800; margin-bottom: 0.45rem;">
      {packageReadiness().title}
    </div>
    <div style="line-height: 1.55;">
      {packageReadiness().message}
    </div>
  </div>

  <div
    style="
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid #e2ebf3;
      border-radius: 16px;
      background: #f8fbff;
    "
  >
    <div style="font-weight: 700; margin-bottom: 0.55rem;">Resumen de completitud</div>
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.6rem;
        color: #516273;
        line-height: 1.55;
      "
    >
      <div><strong>Total registradas:</strong> {evidenceSummary().total}</div>
      <div><strong>Sólidas:</strong> {evidenceSummary().solid}</div>
      <div><strong>Parciales:</strong> {evidenceSummary().partial}</div>
      <div><strong>Débiles:</strong> {evidenceSummary().weak}</div>
    </div>

    <div style="margin-top: 0.7rem; color: #607386; line-height: 1.55;">
      Una evidencia sólida tiene al menos referencia clara, descripción, qué demuestra y alguna base de trazabilidad como fecha, GPS o archivo adjunto.
    </div>
  </div>

  <div style="display: grid; gap: 1rem; margin-top: 1rem;">
    {#if !caseData?.evidence || caseData.evidence.length === 0}
      <div style="color: #5f7286;">Aún no se registró evidencia.</div>
    {:else}
      {#each caseData.evidence as evidence}
        {@const assessed = assessEvidenceItem(evidence)}
        {@const statusStyles = getStatusStyles(assessed.status)}

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
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 1rem;
              flex-wrap: wrap;
              margin-bottom: 0.9rem;
            "
          >
            <div>
              <div style="font-weight: 800; color: #1a2d3f;">
                {evidence.name || evidence.type || 'Evidencia sin nombre'}
              </div>
              <div style="margin-top: 0.2rem; color: #5f7286; line-height: 1.45;">
                {evidence.type || 'Tipo pendiente'}
                {#if evidence.date}
                  · {evidence.date}
                {/if}
                {#if evidence.gps}
                  · GPS registrado
                {/if}
                {#if evidence.fileName}
                  · Archivo adjunto
                {/if}
              </div>
            </div>

            <div
              style={`
                padding: 0.4rem 0.7rem;
                border-radius: 999px;
                border: 1px solid ${statusStyles.border};
                background: ${statusStyles.background};
                color: ${statusStyles.color};
                font-weight: 700;
                font-size: 0.92rem;
              `}
            >
              Evidencia {assessed.status}
            </div>
          </div>

          {#if assessed.missing.length > 0}
            <div
              style="
                margin-bottom: 0.9rem;
                padding: 0.85rem;
                border-radius: 12px;
                background: #fff8f0;
                border: 1px solid #f0dcc1;
                color: #7a5a1d;
                line-height: 1.5;
              "
            >
              <strong>Faltan datos útiles para fortalecer esta evidencia:</strong>
              <div style="margin-top: 0.3rem;">
                {assessed.missing.join(' · ')}
              </div>
            </div>
          {/if}

          <div
            style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 0.8rem;
            "
          >
            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">Tipo</div>
              <select
                value={evidence.type || ''}
                onchange={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'type',
                    (e.currentTarget as HTMLSelectElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px; background: white;"
              >
                <option value="">Seleccionar tipo</option>
                {#each evidenceTypeOptions as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            </label>

            <!-- Nombre: no-controlado, guarda solo al salir del campo -->
            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">Nombre</div>
              <input
                value={evidence.name || ''}
                onblur={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'name',
                    (e.currentTarget as HTMLInputElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px;"
              />
            </label>

            <!-- Fecha -->
            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">Fecha</div>
              <input
                value={evidence.date || ''}
                onblur={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'date',
                    (e.currentTarget as HTMLInputElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px;"
              />
            </label>

            <!-- GPS -->
            <label>
              <div style="margin-bottom: 0.35rem; font-weight: 600;">GPS</div>
              <input
                value={evidence.gps || ''}
                onblur={(e) =>
                  onUpdateEvidence(
                    evidence.id,
                    'gps',
                    (e.currentTarget as HTMLInputElement).value
                  )}
                style="width: 100%; padding: 0.65rem; border: 1px solid #cfd8e3; border-radius: 12px;"
              />
            </label>
          </div>

          <div style="margin-top: 0.35rem; color: #66798b; font-size: 0.92rem; line-height: 1.45;">
            {evidenceTypeHelp(evidence.type)}
          </div>

          <!-- Descripción: no-controlada, guarda solo al salir -->
          <label style="display: block; margin-top: 0.8rem;">
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Descripción</div>
            <textarea
              rows="3"
              onblur={(e) =>
                onUpdateEvidence(
                  evidence.id,
                  'description',
                  (e.currentTarget as HTMLTextAreaElement).value
                )}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px; font-family: inherit; font-size: 1rem;"
            >{evidence.description || ''}</textarea>
          </label>

          <!-- Qué demuestra: no-controlada, guarda solo al salir -->
          <label style="display: block; margin-top: 0.8rem;">
            <div style="margin-bottom: 0.35rem; font-weight: 600;">Qué demuestra esta evidencia</div>
            <textarea
              rows="3"
              onblur={(e) =>
                onUpdateEvidence(
                  evidence.id,
                  'whatItShows',
                  (e.currentTarget as HTMLTextAreaElement).value
                )}
              style="width: 100%; padding: 0.7rem; border: 1px solid #cfd8e3; border-radius: 12px; font-family: inherit; font-size: 1rem;"
            >{evidence.whatItShows || ''}</textarea>
          </label>

          <div style="margin-top: 0.35rem; color: #66798b; font-size: 0.92rem; line-height: 1.45;">
            Explica qué prueba, confirma o refuerza esta pieza dentro del caso.
          </div>

          <!-- ── Adjuntar archivo / tomar foto ── -->
          <div style="margin-top: 0.9rem; display: grid; gap: 0.7rem;">

            <!-- Previsualización de imagen (si el archivo adjunto es una imagen) -->
            {#if evidence.fileData && evidence.fileData.startsWith('data:image/')}
              <div style="
                border: 1px solid #dbe6ef;
                border-radius: 14px;
                overflow: hidden;
                background: #f4f8fc;
                text-align: center;
                padding: 0.5rem;
              ">
                <img
                  src={evidence.fileData}
                  alt={evidence.fileName || 'Imagen adjunta'}
                  style="
                    max-width: 100%;
                    max-height: 320px;
                    border-radius: 10px;
                    display: block;
                    margin: 0 auto;
                    object-fit: contain;
                  "
                />
                {#if evidence.fileName}
                  <div style="font-size: 0.82rem; color: #6a7b8c; margin-top: 0.4rem;">
                    {evidence.fileName}
                  </div>
                {/if}
              </div>

            <!-- Icono de archivo no-imagen adjunto -->
            {:else if evidence.fileName}
              <div style="
                display: flex;
                align-items: center;
                gap: 0.6rem;
                padding: 0.65rem 0.9rem;
                border: 1px solid #dbe6ef;
                border-radius: 12px;
                background: #f8fbff;
                font-size: 0.92rem;
                color: #4a5f72;
              ">
                <span style="font-size: 1.2rem;">📎</span>
                <span>{evidence.fileName}</span>
              </div>
            {/if}

            <!-- Botones de carga -->
            <div style="display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center;">

              <!-- Tomar foto con la cámara del dispositivo -->
              <label style="
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.55rem 1rem;
                border: 1px solid #1B5C8C;
                border-radius: 10px;
                background: #eef4fb;
                color: #1B5C8C;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
              ">
                <span style="font-size: 1rem;">📷</span>
                Tomar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style="display: none;"
                  onchange={(e) => {
                    const input = e.currentTarget as HTMLInputElement;
                    const file = input.files?.[0];
                    if (file) onUploadEvidenceFile(evidence.id, file);
                    input.value = '';
                  }}
                />
              </label>

              <!-- Cargar desde galería o archivos -->
              <label style="
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.55rem 1rem;
                border: 1px solid #cfd8e3;
                border-radius: 10px;
                background: white;
                color: #4a5f72;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
              ">
                <span style="font-size: 1rem;">📁</span>
                {evidence.fileName ? 'Cambiar archivo' : 'Cargar archivo'}
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  style="display: none;"
                  onchange={(e) => {
                    const input = e.currentTarget as HTMLInputElement;
                    const file = input.files?.[0];
                    if (file) onUploadEvidenceFile(evidence.id, file);
                    input.value = '';
                  }}
                />
              </label>

              <!-- Botón eliminar evidencia -->
              <button
                onclick={() => onDeleteEvidence(evidence.id)}
                style="
                  margin-left: auto;
                  padding: 0.55rem 0.8rem;
                  border: 1px solid #e2b8b8;
                  background: white;
                  color: #9a2f2f;
                  border-radius: 10px;
                  cursor: pointer;
                  font-family: inherit;
                "
              >
                Eliminar evidencia
              </button>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</section>