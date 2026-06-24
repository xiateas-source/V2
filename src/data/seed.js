import { isSeeded, markSeeded, putAll, getSeedVersion, setSeedVersion, clearStore } from './local.js';

const CURRENT_SEED_VERSION = 4;

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
  const [spells, feats, glossary, maneuvers, xpThresholds,
    fighter, rogue, bard, barbarian, cleric, druid, monk,
    paladin, ranger, sorcerer, warlock, wizard, rules] = await Promise.all([
    import('../../data/spells.json').then(m => m.default),
    import('../../data/feats.json').then(m => m.default),
    import('../../data/glossary.json').then(m => m.default),
    import('../../data/maneuvers.json').then(m => m.default),
    import('../../data/xp-thresholds.json').then(m => m.default),
    import('../../data/level-up-fighter.json').then(m => m.default),
    import('../../data/level-up-rogue.json').then(m => m.default),
    import('../../data/level-up-bard.json').then(m => m.default),
    import('../../data/level-up-barbarian.json').then(m => m.default),
    import('../../data/level-up-cleric.json').then(m => m.default),
    import('../../data/level-up-druid.json').then(m => m.default),
    import('../../data/level-up-monk.json').then(m => m.default),
    import('../../data/level-up-paladin.json').then(m => m.default),
    import('../../data/level-up-ranger.json').then(m => m.default),
    import('../../data/level-up-sorcerer.json').then(m => m.default),
    import('../../data/level-up-warlock.json').then(m => m.default),
    import('../../data/level-up-wizard.json').then(m => m.default),
    import('../../data/rules.json').then(m => m.default),
  ]);

  await Promise.all([
    putAll('spells', spells),
    putAll('feats', feats),
    putAll('glossary', glossary),
    putAll('maneuvers', maneuvers),
    putAll('xpThresholds', xpThresholds),
    putAll('classData', [...fighter, ...rogue, ...bard, ...barbarian, ...cleric, ...druid,
      ...monk, ...paladin, ...ranger, ...sorcerer, ...warlock, ...wizard]),
    putAll('compendium', rules),
  ]);
}

async function runMigrations(fromVersion) {
  if (fromVersion < 3) {
    const rules = await import('../../data/rules.json').then(m => m.default);
    await putAll('compendium', rules);
  }
  if (fromVersion < 4) {
    await clearStore('spells');
    const spells = await import('../../data/spells.json').then(m => m.default);
    await putAll('spells', spells);
    const classFiles = await Promise.all([
      import('../../data/level-up-fighter.json').then(m => m.default),
      import('../../data/level-up-rogue.json').then(m => m.default),
      import('../../data/level-up-bard.json').then(m => m.default),
      import('../../data/level-up-barbarian.json').then(m => m.default),
      import('../../data/level-up-cleric.json').then(m => m.default),
      import('../../data/level-up-druid.json').then(m => m.default),
      import('../../data/level-up-monk.json').then(m => m.default),
      import('../../data/level-up-paladin.json').then(m => m.default),
      import('../../data/level-up-ranger.json').then(m => m.default),
      import('../../data/level-up-sorcerer.json').then(m => m.default),
      import('../../data/level-up-warlock.json').then(m => m.default),
      import('../../data/level-up-wizard.json').then(m => m.default),
    ]);
    await clearStore('classData');
    await putAll('classData', classFiles.flat());
  }
}
