export function parseMarkdownAdventure(text) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');
  const name = extractTitle(lines);
  if (!name) return null;

  const chapters = splitChapters(lines);
  if (!chapters.length) return null;

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

  const premise = chapters[0]?.summary || '';

  return {
    name,
    setting: '',
    premise,
    moduleProgress,
    npcs: dedupeByName(allNpcs),
    locations: dedupeByName(allLocations),
    contract: 'Follow the published adventure structure. Use only established content from the provided material. Do not invent major plot points not in the source.',
  };
}

function extractTitle(lines) {
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)/);
    if (m) return m[1].trim();
  }
  return null;
}

function splitChapters(lines) {
  const chapters = [];
  let current = null;
  let bodyLines = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (current) {
        chapters.push(buildChapter(current, bodyLines));
      }
      current = h2[1].trim();
      bodyLines = [];
    } else if (current) {
      bodyLines.push(line);
    }
  }
  if (current) {
    chapters.push(buildChapter(current, bodyLines));
  }

  if (!chapters.length) {
    const h1 = lines.find(l => l.match(/^#\s+/));
    const h1idx = h1 ? lines.indexOf(h1) : 0;
    const body = lines.slice(h1idx + 1).join('\n');
    if (body.trim()) {
      chapters.push(buildChapter(extractTitle(lines) || 'Chapter 1', lines.slice(h1idx + 1)));
    }
  }

  return chapters;
}

function buildChapter(title, bodyLines) {
  const body = bodyLines.join('\n');
  const summary = extractFirstParagraph(bodyLines);
  const npcs = extractNpcNames(body);
  const locations = extractLocationNames(body);
  return { title, summary, npcs, locations };
}

function extractFirstParagraph(lines) {
  let para = '';
  let started = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && started) break;
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('|') && !trimmed.startsWith('-')) {
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
    /\*\*([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\*\*/g,
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

function extractLocationNames(text) {
  const locs = new Set();
  const patterns = [
    /\{@area ([^}|]+)/g,
    /###\s+(.+)/g,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const name = m[1].trim();
      if (name.length > 2 && name.length < 60) locs.add(name);
    }
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
