const CHAPTER_PATTERNS = [
  /^#{1,3}\s+(.+)/m,
  /^Chapter\s+\d+[:.]\s*(.+)/im,
  /^Part\s+\d+[:.]\s*(.+)/im,
  /^Appendix\s+[A-Z][:.]\s*(.+)/im,
  /^CHAPTER\s+\d+/m,
  /^Introduction$/im,
  /^Prologue$/im,
  /^Epilogue$/im,
];

const MAX_CHUNK_LENGTH = 8000;
const MIN_CHUNK_LENGTH = 500;

export function splitIntoChunks(text) {
  if (!text) return [];

  const lines = text.split('\n');
  const boundaries = [];

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of CHAPTER_PATTERNS) {
      if (pattern.test(lines[i].trim())) {
        const match = lines[i].trim().match(pattern);
        boundaries.push({ line: i, title: match?.[1]?.trim() || lines[i].trim() });
        break;
      }
    }
  }

  if (boundaries.length === 0) {
    return splitBySize(text);
  }

  const chunks = [];
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].line;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].line : lines.length;
    const chunkText = lines.slice(start, end).join('\n').trim();

    if (chunkText.length < MIN_CHUNK_LENGTH && chunks.length > 0) {
      chunks[chunks.length - 1].text += '\n\n' + chunkText;
    } else if (chunkText.length > MAX_CHUNK_LENGTH) {
      const subChunks = splitBySize(chunkText, boundaries[i].title);
      chunks.push(...subChunks);
    } else {
      chunks.push({ title: boundaries[i].title, text: chunkText });
    }
  }

  if (boundaries[0].line > 0) {
    const preamble = lines.slice(0, boundaries[0].line).join('\n').trim();
    if (preamble.length >= MIN_CHUNK_LENGTH) {
      chunks.unshift({ title: 'Introduction', text: preamble });
    } else if (chunks.length > 0) {
      chunks[0].text = preamble + '\n\n' + chunks[0].text;
    }
  }

  return chunks;
}

function splitBySize(text, baseTitle = 'Section') {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';
  let idx = 1;

  for (const para of paragraphs) {
    if (current.length + para.length > MAX_CHUNK_LENGTH && current.length >= MIN_CHUNK_LENGTH) {
      chunks.push({ title: `${baseTitle} (${idx})`, text: current.trim() });
      current = para;
      idx++;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }

  if (current.trim()) {
    chunks.push({ title: `${baseTitle} (${idx})`, text: current.trim() });
  }

  return chunks;
}
