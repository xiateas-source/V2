export function parseMarkdownAdventure(text, fileName) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');
  const chapters = splitIntoChapters(lines);
  if (!chapters.length) return null;

  const nameFromFile = fileName?.replace(/\.[^.]+$/, '') || null;
  const name = nameFromFile || chapters[0]?.title || 'Imported Adventure';

  const moduleProgress = [];
  const allNpcs = [];
  const allLocations = [];

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    moduleProgress.push({
      id: `ch_${i}`,
      title: ch.title,
      status: i === 0 ? 'active' : 'pending',
      discovered: i === 0,
      summary: ch.summary,
    });
    for (const npc of ch.npcs) {
      allNpcs.push({ name: npc, role: 'npc', status: 'active', disposition: 'Unknown', chapter: `ch_${i}` });
    }
    for (const loc of ch.locations) {
      allLocations.push({ name: loc, type: 'area', chapter: `ch_${i}` });
    }
  }

  return {
    name,
    setting: '',
    premise: chapters[0]?.summary || '',
    moduleProgress,
    npcs: dedupeByName(allNpcs),
    locations: dedupeByName(allLocations),
    contract: 'Follow the published adventure structure. Use only established content from the provided material. Do not invent major plot points not in the source.',
  };
}

function splitIntoChapters(lines) {
  const sections = [];
  let current = null;
  let bodyLines = [];

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);

    if (h1 && !line.startsWith('##')) {
      if (current) sections.push({ title: current, body: bodyLines });
      current = h1[1].trim();
      bodyLines = [];
    } else if (h2 && !current) {
      current = h2[1].trim();
      bodyLines = [];
    } else if (current) {
      bodyLines.push(line);
    }
  }
  if (current) sections.push({ title: current, body: bodyLines });

  return sections.map(s => buildChapter(s.title, s.body));
}

function buildChapter(title, bodyLines) {
  const body = bodyLines.join('\n');
  const summary = extractFirstParagraph(bodyLines);
  const npcs = extractNpcNames(body);
  const locations = extractKeyLocations(body);
  return { title, summary, npcs, locations };
}

function extractFirstParagraph(lines) {
  let para = '';
  let started = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && started) break;
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('|') && !trimmed.startsWith('-') && !trimmed.startsWith('>')) {
      started = true;
      para += (para ? ' ' : '') + trimmed;
    }
  }
  return para.slice(0, 300);
}

function extractNpcNames(text) {
  const names = new Set();
  const patterns = [
    /\{@creature ([^}|]+)/g,
    /\{@npc ([^}|]+)/g,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const name = m[1].trim();
      if (name.length > 2 && name.length < 40) names.add(name);
    }
  }
  return [...names];
}

function extractKeyLocations(text) {
  const locs = new Set();
  const m = text.matchAll(/\{@area ([^}|]+)/g);
  for (const match of m) {
    const name = match[1].trim();
    if (name.length > 2 && name.length < 60) locs.add(name);
  }
  const h2s = text.matchAll(/^##\s+(.+)/gm);
  for (const match of h2s) {
    const name = match[1].trim();
    if (name.length > 2 && name.length < 60) locs.add(name);
  }
  return [...locs];
}

function dedupeByName(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (!item.name || seen.has(item.name.toLowerCase())) return false;
    seen.add(item.name.toLowerCase());
    return true;
  });
}
