export async function refineWithLLM(payload: unknown) {
  const response = await fetch('/api/refine-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || 'No se pudo refinar el documento.');
  }

  return JSON.parse(text);
}

export async function enrichReadingWithLLM(payload: unknown) {
  const response = await fetch('/api/enrich-reading', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || 'No se pudo enriquecer la lectura preliminar.');
  }

  return JSON.parse(text);
}

export async function evaluateNormsWithLLM(payload: unknown) {
  const response = await fetch('/api/evaluate-norms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || 'No se pudieron valorar las normas.');
  }

  return JSON.parse(text);
}