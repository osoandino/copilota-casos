import type { DocumentUseKey } from '$lib/types/normative';

export const documentUseOptions: { key: DocumentUseKey; label: string }[] = [
  { key: 'ficha_resumen', label: 'Ficha resumen' },
  { key: 'solicitud_inspeccion', label: 'Solicitud de inspección' },
  { key: 'solicitud_informacion', label: 'Solicitud de información' },
  { key: 'nota_seguimiento', label: 'Nota de seguimiento' },
  { key: 'acta_comunitaria', label: 'Acta comunitaria' },
  { key: 'cronologia', label: 'Cronología' },
  { key: 'presentacion_alt', label: 'Presentación a la ALT' },
  { key: 'presentacion_defensoria', label: 'Presentación a Defensoría del Pueblo' }
];