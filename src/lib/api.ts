export async function fetchCopilotIntent(query: string, schema: string[], metricsSummary: any, attachments: File[] = [], currency: string = "$", history: any[] = []) {
  const filesData = await Promise.all(attachments.map(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          mimeType: file.type || 'application/octet-stream',
          data: base64,
          name: file.name
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }));

  const res = await fetch('/api/ai/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, schema, metricsSummary, files: filesData, currency, history })
  });
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('Server is currently starting up or restarting. Please try again in a few seconds.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze query');
  }
  return res.json();
}
