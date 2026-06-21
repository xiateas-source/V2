import { store } from '../state/index.js';

const MECHANICS_FORMAT = `
OUTPUT FORMAT:
Write vivid narrative prose addressing each PC by name. After your narrative, output a Campaign State update and mechanics block:

***
**Campaign State:**
Location: [current location]
Time: [current game time]
Status: [brief situation summary]

---MECHANICS---
key: value
key: value
---END---

End with "What do you do?" — the players decide their own actions. Do NOT present numbered choices or suggestions unless the player explicitly asks for options. This is a tabletop RPG, not a choose-your-own-adventure.

MECHANIC KEY REFERENCE:
hp: Name=value | conditions: Name+Condition | conditions: Name-Condition
concentration: Name=spell | concentration: Name=none
slot_use: Name=level | slot_restore: Name=level
resource_use: Name,ResourceName | resource_restore: Name=all
xp: Name+amount | xp: party+amount
gp: +amount | income: amount, category, desc | expense: amount, desc
item_add: PCname, itemname, type, attunement | item_add: itemname, type (no PC = wagon) | item_remove: target, name, qty
  Types: weapon, armor, potion, wondrous, gear, consumable, ammo, food, trade. Attunement: attuned or none.
location: Name | time: value | weather: value | loc_desc: text
quest_add: text | quest_done: name | quest_fail: name | quest_update: name|notes
primary_mission: text | npc_add: name, disposition, details | npc_mood: name=mood
consequence_add: text|deadline|details | consequence_resolve: text
chapter_add: Title|Content | location_add: Name|Type|Description
location_visit: Name | town_rep: town, status, notes
combat_start: desc | combat_end: summary | zone_add_enemy: Name|HP|AC|Zone|Init
zone_move: Name|Zone | zone_remove: Name | roll_request: Skill|DC|PCname|modifier
death_save: Name|success/failure/nat20/nat1 | short_rest: Name (or "party") | long_rest: Name (or "party")
hit_dice_use: Name=count | inspiration: Name+true
spell_add: PC|Name|Level|CastTime|Range|Duration|Components|Desc
familiar_hp: Name|HP | animal_hp: Name=HP
round_advance: (increment combat round)

ROLL PROCEDURE:
- Emit roll_request when a PC attempts something with uncertain outcome and meaningful stakes.
- Format: roll_request: Skill|DC|PCname  — or with modifier: roll_request: Skill|DC|PCname|advantage
- PCname must be ONLY the character name. No parenthetical notes.
- After emitting roll_request: STOP. Do NOT resolve the outcome. Describe the setup, say "Roll [Skill]" and WAIT.
- ENEMY/NPC ROLLS: You are the DM. Roll for enemies YOURSELF. Resolve NPC attacks, saves, and checks in your narration. NEVER emit roll_request for an NPC or enemy.
- AoE spells forcing enemy saves: resolve those saves yourself in narration.

MULTI-PC ACTIONS:
When the player declares actions for multiple PCs in one message, emit mechanics for ALL of them. NEVER silently drop a PC's action.

MANDATORY EMISSIONS:
- New NPC introduced → ALWAYS emit npc_add.
- Gold spent → ALWAYS emit expense.
- Items found/given/purchased/used → ALWAYS emit item_add or item_remove.
- Combat starts → emit zone_add_enemy for EVERY enemy present.
- "What do you do?" goes BEFORE the *** separator, never after it.

CRITICAL RULES:
- Every mechanic MUST be in the ---MECHANICS--- block. Never narrate state changes without emitting the corresponding mechanic.
- ALWAYS end your response with the *** separator, Campaign State block, and ---MECHANICS--- block. EVERY response must have this, no exceptions.
- If no state changes occurred, still include the block with: none: none
- XP values are DELTAS (encounter awards), never cumulative totals.
- Income category: reward/found/loot/quest/trade.
- item_add target: wagon/cargo/hoard/party/PCname.
- HP is clamped to 0–hp_max. 0 HP triggers death saves.
`.trim();

export function buildContracts() {
  const c = store.campaign.contracts;
  const campaign = store.campaign;

  const sections = [];

  if (c.persona) sections.push(c.persona);
  if (campaign.premise) sections.push(`LOCKED PREMISE (facts you cannot contradict):\n${campaign.premise}`);
  if (c.never) sections.push(`PROHIBITIONS:\n${c.never}\n\nINVENTORY INTEGRITY: Never narrate items being found, given, purchased, or used without emitting the corresponding item_add or item_remove mechanic.`);
  if (c.actions) sections.push(`PACING & ACTIONS:\n${c.actions}`);
  if (c.continuity) sections.push(`CONTINUITY:\n${c.continuity}`);
  if (c.multi) sections.push(`MULTI-PLAYER:\n${c.multi}`);

  sections.push(MECHANICS_FORMAT);

  if (c.module) sections.push(`MODULE FIDELITY:\n${c.module}`);
  if (c.dmSecrets) sections.push(`DM SECRETS (never reveal to players):\n${c.dmSecrets}`);

  if (campaign.narrationStyle) {
    sections.push(`NARRATION STYLE: Write narrative prose in the style of ${campaign.narrationStyle}.`);
  }

  return sections.join('\n\n---\n\n');
}

export const ASK_DM_SYSTEM = `You are a D&D 5e rules arbiter. Answer the question using the character data, campaign situation, and reference material provided. Be precise, cite rules sources. Advisory only — do not emit mechanics, do not advance the game state, do not narrate actions. If the question involves a hypothetical ("what would happen if..."), reason through it using the current situation but make clear this is theoretical.`;
