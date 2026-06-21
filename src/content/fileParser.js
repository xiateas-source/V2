export async function extractText(file) {
  if (!file) return null;
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'pdf') return extractPdfText(file);
  if (ext === 'epub') return extractEpubText(file);
  return null;
}

async function extractPdfText(file) {
  const pdfjsLib = await loadPdfJs();
  if (!pdfjsLib) throw new Error('PDF.js not available. Install pdfjs-dist or include via CDN.');

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

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  try {
    const url = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
    const mod = await import(/* @vite-ignore */ url);
    if (mod.GlobalWorkerOptions) {
      mod.GlobalWorkerOptions.workerSrc = '';
    }
    window.pdfjsLib = mod;
    return mod;
  } catch (_) {
    return null;
  }
}

async function extractEpubText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { unzipSync, strFromU8 } = await loadFflate();

  const files = unzipSync(new Uint8Array(arrayBuffer));
  const textParts = [];

  const sortedPaths = Object.keys(files).sort();
  for (const path of sortedPaths) {
    if (path.endsWith('.xhtml') || path.endsWith('.html') || path.endsWith('.htm')) {
      const content = strFromU8(files[path]);
      const text = stripHtml(content);
      if (text.trim()) textParts.push(text);
    }
  }

  return textParts.join('\n\n');
}

async function loadFflate() {
  try {
    const url = 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js';
    return await import(/* @vite-ignore */ url);
  } catch (_) {
    throw new Error('Could not load epub decompression library (fflate).');
  }
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body?.textContent || '';
}
