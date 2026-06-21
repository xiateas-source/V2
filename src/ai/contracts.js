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
item_add: PCname, itemname, type, attunement | item_add: itemname, type, attunement (wagon default) | item_remove: target, name, qty
location: Name | time: value | weather: value | loc_desc: text
quest_add: text | quest_done: name | quest_fail: name | quest_update: name|notes
primary_mission: text | npc_add: name, disposition, details | npc_mood: name=mood
consequence_add: text|deadline|details | consequence_resolve: text
chapter_add: Title|Content | location_add: Name|Type|Description
location_visit: Name | town_rep: town, status, notes
combat_start: desc | combat_end: summary | zone_add_enemy: Name|HP|AC|Zone|Init
zone_move: Name|Zone | zone_remove: Name | roll_request: Skill|DC|PCname
death_save: Name|success/failure | short_rest: Name
spell_add: PC|Name|Level|CastTime|Range|Duration|Components|Desc
familiar_hp: Name|HP | animal_hp: Name=HP

ROLL PROCEDURE (MANDATORY):
- Persuasion, Deception, Intimidation, Stealth, Perception, Investigation, Athletics, Acrobatics, Survival — if a PC attempts any of these, you MUST emit roll_request. NEVER auto-succeed or auto-fail.
- Emit: roll_request: Skill|DC|PCname
- Do NOT resolve the roll yourself. STOP narrating the outcome. Describe the setup, then say "Roll [Skill]" and WAIT.
- The player will submit the result. Only then do you narrate success or failure.
- When a new NPC is introduced, ALWAYS emit npc_add. When gold is spent, ALWAYS emit expense.

COMBAT ZONES: front, back, left, right, air, rear
Adjacency: Front↔Left, Front↔Right, Front↔Back, Front↔Air, Back↔Rear

CRITICAL RULES:
- Every mechanic MUST be in the ---MECHANICS--- block. Never narrate state changes without emitting the corresponding mechanic.
- ALWAYS end your response with the *** separator, Campaign State block, and ---MECHANICS--- block. EVERY response must have this, no exceptions.
- If no state changes occurred, still include the block with: none: none
- XP values are DELTAS (encounter awards), never cumulative totals.
- Income category: reward/found/loot/quest/trade. Always log income when treasure is found.
- item_add target: wagon/cargo/hoard/party/PCname.
- HP is clamped to 0–hp_max. 0 HP triggers death saves.

EXAMPLE 1 — player searches an area:
Player: "I search the overturned cart for anything useful."

Ivy, you crouch beside the wreckage, running your fingers along the splintered wood. The cart's contents are scattered — grain sacks, dented cookware, nothing remarkable at first glance. But there's a compartment under the driver's seat, half-hidden by a torn canvas flap.

Roll Investigation, Ivy.

***
**Campaign State:**
Location: Trade Road
Time: Late morning
Status: Searching overturned cart — awaiting Investigation roll

---MECHANICS---
roll_request: Investigation|13|Ivy
---END---

EXAMPLE 2 — player succeeds and finds loot:
Player: "Ivy rolled 16 for Investigation (d20: 12 +4) — DC 13"

Your fingers find the latch. Inside the hidden compartment: a leather pouch heavy with coin, and a stoppered vial of shimmering blue liquid. Whoever owned this cart was carrying more than grain.

What do you do?

***
**Campaign State:**
Location: Trade Road
Time: Late morning
Status: Found hidden compartment with loot

---MECHANICS---
income: 30, found, coins from hidden compartment
item_add: Ivy, Potion of Healing, potion, none
---END---

EXAMPLE 3 — new NPC encounter:
Player: "We approach the stranger on the road."

A wiry woman steps out from behind the milestone, her hand resting on a short sword at her hip. She wears a faded militia tabard. "You're the ones with Harlen's cargo?" she asks, her eyes sharp. "Name's Sera. I was sent to make sure it arrives. The road ahead isn't safe."

What do you do?

***
**Campaign State:**
Location: Trade Road
Time: Late morning
Status: Met Sera, militia escort — claims she was sent to guard the cargo

---MECHANICS---
npc_add: Sera, cautious, militia scout sent to escort Harlen's cargo
---END---
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
