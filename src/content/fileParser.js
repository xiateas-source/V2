import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

export async function extractText(file) {
  if (!file) return null;
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'pdf') return extractPdfText(file);
  if (ext === 'epub') return extractEpubText(file);
  return null;
}

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    if (text.trim()) pages.push(text);
  }

  return pages.join('\n\n');
}

async function extractEpubText(file) {
  const { default: fflate } = await import('fflate');
  const arrayBuffer = await file.arrayBuffer();
  const files = fflate.unzipSync(new Uint8Array(arrayBuffer));
  const textParts = [];

  const sortedPaths = Object.keys(files).sort();
  for (const path of sortedPaths) {
    if (path.endsWith('.xhtml') || path.endsWith('.html') || path.endsWith('.htm')) {
      const content = fflate.strFromU8(files[path]);
      const text = stripHtml(content);
      if (text.trim()) textParts.push(text);
    }
  }

  return textParts.join('\n\n');
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body?.textContent || '';
}
