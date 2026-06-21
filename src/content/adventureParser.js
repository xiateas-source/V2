export function parseAdventure(json) {
  if (!json || typeof json !== 'object') return null;

  if (json.adventure && Array.isArray(json.adventure)) {
    return parse5eToolsFormat(json);
  }

  if (json.data && json.data.length && json.data[0].entries) {
    return parse5eToolsSingle(json);
  }

  if (json.name && (json.chapters || json.entries || json.sections)) {
    return parseGenericAdventure(json);
  }

  return null;
}

function parse5eToolsFormat(json) {
  const adv = json.adventure[0] || json.adventure;
  const advData = json.adventureData?.[0]?.data || json.data || [];

  const name = adv.name || 'Imported Adventure';
  const setting = adv.setting || '';
  const premise = adv.storyline || adv.overview || '';

  const moduleProgress = [];
  const allNpcs = [];
  const allLocations = [];

  const chapters = adv.contents || adv.chapters || [];
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const chData = advData[i];
    const title = ch.name || ch.title || `Chapter ${i + 1}`;

    moduleProgress.push({
      id: `ch_${i}`,
      title,
      status: i === 0 ? 'active' : 'pending',
      discovered: i === 0,
      summary: extractSummary(chData),
    });

    if (chData) {
      extractNpcs(chData, allNpcs, `ch_${i}`);
      extractLocations(chData, allLocations, `ch_${i}`);
    }
  }

  return {
    name,
    setting,
    premise,
    moduleProgress,
    npcs: dedupeByName(allNpcs),
    locations: dedupeByName(allLocations),
    contract: 'Follow the published adventure structure. Use only established content from the provided material. Do not invent major plot points not in the source.',
  };
}

function parse5eToolsSingle(json) {
  const data = json.data;
  const name = json.name || data[0]?.name || 'Imported Adventure';

  const moduleProgress = [];
  const allNpcs = [];
  const allLocations = [];

  for (let i = 0; i < data.length; i++) {
    const section = data[i];
    moduleProgress.push({
      id: `ch_${i}`,
      title: section.name || `Section ${i + 1}`,
      status: i === 0 ? 'active' : 'pending',
      discovered: i === 0,
      summary: extractSummary(section),
    });
    extractNpcs(section, allNpcs, `ch_${i}`);
    extractLocations(section, allLocations, `ch_${i}`);
  }

  return {
    name,
    setting: '',
    premise: moduleProgress[0]?.summary || '',
    moduleProgress,
    npcs: dedupeByName(allNpcs),
    locations: dedupeByName(allLocations),
    contract: 'Follow the published adventure structure. Use only established content from the provided material.',
  };
}

function parseGenericAdventure(json) {
  const chapters = json.chapters || json.sections || json.entries || [];
  const moduleProgress = [];
  const allNpcs = [];
  const allLocations = [];

  for (let i = 0; i < chapters.length; i++) {
    const ch = typeof chapters[i] === 'string' ? { title: chapters[i] } : chapters[i];
    moduleProgress.push({
      id: `ch_${i}`,
      title: ch.title || ch.name || `Chapter ${i + 1}`,
      status: i === 0 ? 'active' : 'pending',
      discovered: i === 0,
      summary: ch.summary || ch.description || '',
    });
    if (ch.npcs) {
      for (const npc of ch.npcs) {
        const n = typeof npc === 'string' ? { name: npc } : npc;
        allNpcs.push({ ...n, status: 'active', chapter: `ch_${i}` });
      }
    }
    if (ch.locations) {
      for (const loc of ch.locations) {
        const l = typeof loc === 'string' ? { name: loc } : loc;
        allLocations.push({ ...l, chapter: `ch_${i}` });
      }
    }
  }

  return {
    name: json.name || json.title || 'Imported Adventure',
    setting: json.setting || '',
    premise: json.premise || json.description || json.overview || '',
    moduleProgress,
    npcs: dedupeByName(allNpcs),
    locations: dedupeByName(allLocations),
    contract: 'Follow the published adventure structure.',
  };
}

function extractSummary(section) {
  if (!section) return '';
  if (typeof section === 'string') return section.slice(0, 200);
  if (section.entries) {
    for (const entry of section.entries) {
      if (typeof entry === 'string') return entry.slice(0, 200);
      if (entry.entries && typeof entry.entries[0] === 'string') return entry.entries[0].slice(0, 200);
    }
  }
  return '';
}

function extractNpcs(section, results, chapterId) {
  if (!section) return;
  const text = JSON.stringify(section);
  const npcPattern = /\{@creature ([^}|]+)/g;
  let match;
  while ((match = npcPattern.exec(text)) !== null) {
    results.push({ name: match[1], role: 'creature', status: 'active', disposition: 'Unknown', chapter: chapterId });
  }
  const npcPattern2 = /\{@npc ([^}|]+)/g;
  while ((match = npcPattern2.exec(text)) !== null) {
    results.push({ name: match[1], role: 'npc', status: 'active', disposition: 'Unknown', chapter: chapterId });
  }
}

function extractLocations(section, results, chapterId) {
  if (!section) return;
  const text = JSON.stringify(section);
  const locPattern = /\{@area ([^}|]+)/g;
  let match;
  while ((match = locPattern.exec(text)) !== null) {
    results.push({ name: match[1], type: 'area', chapter: chapterId });
  }
}

function dedupeByName(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (!item.name || seen.has(item.name.toLowerCase())) return false;
    seen.add(item.name.toLowerCase());
    return true;
  });
}
