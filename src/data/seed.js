import { isSeeded, markSeeded, putAll } from './local.js';

export async function runSeed() {
  if (await isSeeded()) return;

  const [spells, feats, glossary, maneuvers, xpThresholds, fighter, rogue, bard] = await Promise.all([
    import('../../data/spells.json').then(m => m.default),
    import('../../data/feats.json').then(m => m.default),
    import('../../data/glossary.json').then(m => m.default),
    import('../../data/maneuvers.json').then(m => m.default),
    import('../../data/xp-thresholds.json').then(m => m.default),
    import('../../data/level-up-fighter.json').then(m => m.default),
    import('../../data/level-up-rogue.json').then(m => m.default),
    import('../../data/level-up-bard.json').then(m => m.default),
  ]);

  await Promise.all([
    putAll('spells', spells),
    putAll('feats', feats),
    putAll('glossary', glossary),
    putAll('maneuvers', maneuvers),
    putAll('xpThresholds', xpThresholds),
    putAll('classData', [...fighter, ...rogue, ...bard]),
  ]);

  await markSeeded();
}
