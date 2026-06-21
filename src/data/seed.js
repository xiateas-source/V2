import { isSeeded, markSeeded, putAll, getSeedVersion, setSeedVersion } from './local.js';

const CURRENT_SEED_VERSION = 3;

export async function runSeed() {
  const seeded = await isSeeded();
  const version = await getSeedVersion();

  if (!seeded) {
    await seedAll();
    await markSeeded();
    await setSeedVersion(CURRENT_SEED_VERSION);
    return;
  }

  if (version < CURRENT_SEED_VERSION) {
    await runMigrations(version);
    await setSeedVersion(CURRENT_SEED_VERSION);
  }
}

async function seedAll() {
  const [spells, feats, glossary, maneuvers, xpThresholds, fighter, rogue, bard, rules] = await Promise.all([
    import('../../data/spells.json').then(m => m.default),
    import('../../data/feats.json').then(m => m.default),
    import('../../data/glossary.json').then(m => m.default),
    import('../../data/maneuvers.json').then(m => m.default),
    import('../../data/xp-thresholds.json').then(m => m.default),
    import('../../data/level-up-fighter.json').then(m => m.default),
    import('../../data/level-up-rogue.json').then(m => m.default),
    import('../../data/level-up-bard.json').then(m => m.default),
    import('../../data/rules.json').then(m => m.default),
  ]);

  await Promise.all([
    putAll('spells', spells),
    putAll('feats', feats),
    putAll('glossary', glossary),
    putAll('maneuvers', maneuvers),
    putAll('xpThresholds', xpThresholds),
    putAll('classData', [...fighter, ...rogue, ...bard]),
    putAll('compendium', rules),
  ]);
}

async function runMigrations(fromVersion) {
  if (fromVersion < 3) {
    const rules = await import('../../data/rules.json').then(m => m.default);
    await putAll('compendium', rules);
  }
}
