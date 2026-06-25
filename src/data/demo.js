import { setStore } from '../state/index.js';

function baseDemoCampaign() {
  return {
    id: 'demo_001',
    name: 'The Road to Ashford',
    setting: 'Classic fantasy, Sword Coast',
    narrationStyle: 'Joe Abercrombie',
    premise: 'A band of adventurers travels the old trade road toward Ashford, a frontier town plagued by strange disappearances. They carry cargo in a sturdy wagon and owe a debt to a merchant guild.',

    characters: [
      {
        id: 'pc_ivy',
        name: 'Ivy',
        backstory: 'Former street urchin turned blade-for-hire.',
        appearance: 'Short dark hair, quick eyes, leather armor patched at the elbows.',
        personality: 'Dry humor, fiercely loyal, hates authority.',
        notes: '',
        race: 'Human',
        class: 'Rogue',
        subclass: 'Thief',
        level: 4,
        xp: 2700,
        hpMax: 31,
        ac: 15,
        speed: 30,
        hitDice: { die: 'd8', total: 4, used: 0 },
        abilityScores: { str: 10, dex: 18, con: 12, int: 14, wis: 10, cha: 12 },
        savingThrows: ['dex', 'int'],
        skills: { stealth: 8, perception: 4, sleightOfHand: 8, acrobatics: 6, investigation: 4 },
        proficiencies: ['light armor', 'simple weapons', 'hand crossbows', 'rapiers', 'shortswords', 'thieves tools'],
        features: ['Sneak Attack (2d6)', 'Cunning Action', 'Fast Hands', 'Second-Story Work', 'Uncanny Dodge'],
        cantrips: [],
        knownSpells: [],
        spellSlots: {},
        currentSlots: {},
        resources: [{ name: 'Sneak Attack', max: 1, current: 1, recharge: 'turn', restoresOn: 'turn' }],
        background: 'Urchin',
        alignment: 'Chaotic Good',
        languages: ['Common', 'Thieves Cant'],
        attacks: [
          { name: 'Rapier', bonus: 6, damage: '1d8+4', type: 'piercing' },
          { name: 'Shortbow', bonus: 6, damage: '1d6+4', type: 'piercing', range: '80/320' },
        ],
        color: '#4ae0a0',
        hp: 31,
        hpTemp: 0,
        conditions: [],
        concentration: null,
        exhaustion: 0,
        inspiration: false,
        deathSaves: { successes: 0, failures: 0 },
        familiar: null,
      },
      {
        id: 'pc_thorn',
        name: 'Thorn',
        backstory: 'A half-elf raised by a circle of druids who cast him out for dabbling in arcane magic.',
        appearance: 'Tall, weathered cloak, gnarled staff wrapped in ivy.',
        personality: 'Quiet, protective of nature, surprisingly violent when cornered.',
        notes: '',
        race: 'Half-Elf',
        class: 'Bard',
        subclass: 'College of Lore',
        level: 4,
        xp: 2700,
        hpMax: 27,
        ac: 13,
        speed: 30,
        hitDice: { die: 'd8', total: 4, used: 0 },
        abilityScores: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 18 },
        savingThrows: ['dex', 'cha'],
        skills: { persuasion: 6, performance: 6, arcana: 3, history: 3, insight: 2, perception: 2 },
        proficiencies: ['light armor', 'simple weapons', 'hand crossbows', 'rapiers', 'longswords', 'shortswords', 'lute', 'flute', 'drum'],
        features: ['Bardic Inspiration (d6)', 'Jack of All Trades', 'Song of Rest (d6)', 'Cutting Words', 'Font of Inspiration'],
        cantrips: ['Vicious Mockery', 'Minor Illusion'],
        knownSpells: ['Healing Word', 'Thunderwave', 'Faerie Fire', 'Shatter', 'Heat Metal', 'Suggestion', 'Invisibility'],
        spellSlots: { 1: 4, 2: 3 },
        currentSlots: { 1: 4, 2: 3 },
        resources: [{ name: 'Bardic Inspiration', max: 4, current: 4, recharge: 'long', restoresOn: 'long_rest' }],
        background: 'Hermit',
        alignment: 'Neutral Good',
        languages: ['Common', 'Elvish', 'Sylvan'],
        attacks: [
          { name: 'Rapier', bonus: 4, damage: '1d8+2', type: 'piercing' },
          { name: 'Vicious Mockery', bonus: null, damage: '1d4 psychic', type: 'psychic', save: 'WIS DC 14' },
        ],
        color: '#a070e0',
        hp: 27,
        hpTemp: 0,
        conditions: [],
        concentration: null,
        exhaustion: 0,
        inspiration: false,
        deathSaves: { successes: 0, failures: 0 },
        familiar: null,
      },
    ],

    location: 'Trade Road, 2 miles east of Ashford',
    locDesc: 'A rutted dirt road cutting through sparse woodland. The wagon creaks over roots.',
    time: 'Late afternoon',
    weather: 'Overcast, cool wind',
    travelLog: [],

    gold: { pp: 0, gp: 45, ep: 0, sp: 12, cp: 30 },
    incomeLog: [],
    expenseLog: [],

    inventory: {
      carried: {},
      wagon: [
        { name: 'Rope (50ft)', qty: 2, type: 'gear', weight: 10 },
        { name: 'Rations', qty: 14, type: 'consumable', weight: 2 },
        { name: 'Healing Potion', qty: 3, type: 'potion', weight: 0.5 },
        { name: 'Merchant Guild Cargo (sealed crate)', qty: 1, type: 'quest', weight: 80 },
      ],
      hoard: [],
    },
    wagonState: { animals: [{ name: 'Biscuit', type: 'ox', hp: 15, hpMax: 15 }], maxWeight: 500 },

    quests: [
      { id: 'qst_001', text: 'Deliver the sealed crate to Ashford trading post', status: 'active', location: 'Ashford', giverNpc: 'Guildmaster Harlen', notes: '', chatMsgId: '', discovery: { text: '', ts: '' }, gameTs: '', priority: 1 },
      { id: 'qst_002', text: 'Investigate the disappearances near Ashford', status: 'active', location: 'Ashford', giverNpc: '', notes: 'Rumor: people vanish near the old mine', chatMsgId: '', discovery: { text: '', ts: '' }, gameTs: '', priority: 0 },
    ],
    primaryMission: 'Deliver the sealed crate to Ashford and investigate the disappearances.',
    npcs: [
      { id: 'npc_001', name: 'Guildmaster Harlen', disposition: 'Business-like', details: 'Gave the delivery job. Warned not to open the crate.', status: 'active', hp: null, lastSeen: 'Waterdeep', race: 'Human', role: 'quest-giver', gameTs: '' },
    ],
    chapters: [],
    consequences: [
      { id: 'csq_001', text: 'The crate must reach Ashford within 3 days or the guild marks the debt as defaulted.', type: 'deadline', resolved: false, resolvedTs: null, gameTs: '', location: 'Trade Road', deadline: '3 days', _ripple: false },
    ],
    townReputation: [],
    secrets: [],
    moduleProgress: [],
    locations: [
      { id: 'loc_001', name: 'Ashford', type: 'town', status: 'undiscovered', firstVisited: '', lastVisited: '', rep: { disposition: '', notes: '' }, npcs: [], investments: [], history: [], dmNotes: '', playerNotes: '', mapPos: null },
    ],

    combatState: {
      active: false,
      round: 0,
      initiative: [],
      currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: {},
    },

    narrative: [
      { id: 'nar_demo_1', type: 'player', content: 'We set out on the trade road toward Ashford with the sealed crate loaded on the wagon.', ts: 1, gameTs: null, playerName: null, partial: false },
      { id: 'nar_demo_2', type: 'dm', content: 'The wagon groans as Biscuit leans into the harness, hooves squelching in the mud. The trade road stretches east through rolling farmland — green and deceptively peaceful. Ivy, you ride shotgun, scanning the treeline with the practiced paranoia of someone who\'s been ambushed before. Thorn, you sit in the back, one hand on the sealed crate, the other absently plucking a melody on your lute.\n\nTwo miles out, the road narrows. The hedgerows press in close, thick with brambles and the buzzing of fat flies. The air smells wrong — sweet and rotten, like spoiled fruit. Biscuit snorts and slows.\n\nUp ahead, a cart sits overturned across the road. No horse. No driver. Just scattered crates and a dark stain on the dirt that could be wine. Or could be blood.\n\nWhat do you do?\n\n***\n**Campaign State:**\nLocation: Trade Road, 2 miles east of Ashford\nTime: Late morning\nStatus: Overturned cart blocking the road — possible ambush\n\n---MECHANICS---\nlocation: Trade Road, 2 miles east of Ashford\ntime: Late morning\nweather: Overcast, cool wind\n---END---', ts: 2, gameTs: 'Late morning', playerName: null, partial: false, mechanics: { applied: [{ key: 'location', value: 'Trade Road, 2 miles east of Ashford', applied: true }, { key: 'time', value: 'Late morning', applied: true }, { key: 'weather', value: 'Overcast, cool wind', applied: true }], rejected: [] } },
      { id: 'nar_demo_3', type: 'player', content: 'Ivy checks the overturned cart for traps or hidden threats.', ts: 3, gameTs: null, playerName: null, partial: false },
      { id: 'nar_demo_4', type: 'dm', content: 'Ivy, you slide off the wagon, landing softly in the mud. Your eyes trace the edges of the overturned cart — the way the wheels are angled, the pattern of the scattered goods. Something about this feels staged. Too neat. The crates fell in a line, not scattered the way they would in a real accident.\n\nYou crouch low, scanning the underside of the cart. There could be something rigged.\n\nRoll Investigation, Ivy.\n\n***\n**Campaign State:**\nLocation: Trade Road, 2 miles east of Ashford\nTime: Late morning\nStatus: Ivy investigating overturned cart — awaiting Investigation roll\n\n---MECHANICS---\nroll_request: Investigation|13|Ivy\n---END---', ts: 4, gameTs: 'Late morning', playerName: null, partial: false, mechanics: { applied: [{ key: 'roll_request', value: 'Investigation|13|Ivy', applied: true }], rejected: [] } },
      { id: 'nar_demo_5', type: 'player', content: 'Ivy rolled 18 for Investigation (d20: 14 +4) — DC 13', ts: 5, gameTs: null, playerName: null, partial: false },
      { id: 'nar_demo_6', type: 'dm', content: 'Your trained eye catches it — a thin wire, nearly invisible, running from the cart\'s axle to a bundle wedged under the driver\'s seat. A crude trap. If someone had tried to right the cart or pull the crates free, it would have triggered... something. You trace the wire carefully. It leads to a clay pot packed with what smells like alchemist\'s fire.\n\nSomeone set this up deliberately. And recently — the mud around the wire is still wet, not dried into the ruts.\n\nThorn, from the wagon you spot movement in the hedgerow to the left. Just a flicker. Could be an animal. Could be worse.\n\nWhat do you do?\n\n***\n**Campaign State:**\nLocation: Trade Road, 2 miles east of Ashford\nTime: Late morning\nStatus: Trap found on cart. Movement spotted in hedgerow.\n\n---MECHANICS---\nconsequence_add: Ambush likely — movement in hedgerow near trapped cart|immediate|Unknown threat hiding in hedgerow\n---END---', ts: 6, gameTs: 'Late morning', playerName: null, partial: false, mechanics: { applied: [{ key: 'consequence_add', value: 'Ambush likely — movement in hedgerow near trapped cart|immediate|Unknown threat hiding in hedgerow', applied: true }], rejected: [] } },
    ],
    ooc: [],

    sessionArchive: [],
    checkpoints: [],

    contracts: {
      persona: 'You are a darkly humorous Dungeon Master who loves morally gray choices, memorable NPCs, and tactical combat. You never pull punches but reward creativity. Your tone is cinematic and propulsive. You are NOT a yes-man — the world pushes back. NPCs have their own agendas and will refuse, lie, or betray the party when it fits their character. Not every plan works. Not every door opens. Not every fight is winnable. Say no when the fiction demands it.',
      never: 'Never kill a PC without death saves. Never reveal DM secrets. Never speak for a PC unless the player explicitly delegates. Never auto-resolve rolls. Never let players succeed automatically at things that should be difficult or risky — call for rolls, impose consequences, create complications.',
      actions: 'One major scene per response. Keep combat turns tight — one turn per response. End with "What do you do?" — do NOT present numbered choices or suggestions unless the player explicitly asks for options.',
      continuity: 'Track consequences. Reference past events. NPCs remember what the party did. Actions have ripple effects — helping one faction may anger another. Shortcuts have costs.',
      multi: 'Address each PC by name. When the player declares actions for MULTIPLE PCs in one message, you MUST emit mechanics for ALL of them — not just the first. If Ivy attacks and Thorn casts a spell, emit roll_request for Ivy AND emit concentration + slot_use + enemy saves for Thorn. Never silently drop a PC action. Every declared action gets its mechanics.',
      module: '',
      dmSecrets: 'The sealed crate contains a captive fey creature. Guildmaster Harlen knows. The disappearances in Ashford are connected — the old mine is a portal.',
    },
  };
}

export function loadDemoCampaign() {
  setStore('campaign', baseDemoCampaign());
  setStore('system', 'activeCampaignId', 'demo_001');
}

// Testing fixture: a campaign with every tab heavily populated so all Journal,
// Cargo, spell, and pill features are visible at once. Built on the base demo.
export function loadFullDemo() {
  const c = baseDemoCampaign();
  c.id = 'demo_full';
  c.name = 'Hoard of the Dragon Queen (test fixture)';
  c.location = 'Castle Naerytar';
  c.locDesc = 'A crumbling bog-fortress of black stone, fog curling through its ruined halls.';
  c.time = 'Day 60, 08:00 AM';
  c.weather = 'Sulfur-fog';
  c.primaryMission = 'Stop the Cult of the Dragon from gathering the hoard to summon Tiamat.';
  c.gold = { pp: 4, gp: 318, ep: 2, sp: 51, cp: 77 };

  // Coherent context so the fixture is a valid PLAY test (not just a UI test):
  // premise, DM secrets, and the opening narrative all match Castle Naerytar.
  c.setting = 'Forgotten Realms — Sword Coast';
  c.premise = 'The party, disguised in cult robes taken from the hunting lodge, has infiltrated Castle Naerytar — a fog-bound bog-fortress where the Cult of the Dragon is gathering a vast hoard to summon Tiamat. They must find where the treasure is being moved without blowing their cover.';
  c.contracts = {
    ...c.contracts,
    dmSecrets: 'The hoard is teleported out of the castle via a portal hidden in the bog behind the great hall. Rath Modar (Red Wizard) secretly serves Thay, not the cult. Snapjaw the lizardfolk can be turned against the bullywugs. The Wearer of Purple suspects infiltrators and will call a muster by nightfall.',
  };
  c.narrative = [
    { id: 'nar_full_1', type: 'dm', content: 'Fog drags across the flagstones of Castle Naerytar, thick with the rotten-egg stink of the bog. Hooded cultists shuffle past with crates on their shoulders, paying you no mind — your stolen robes hold, for now. Ahead, a broad-shouldered figure in violet directs the loading: the Wearer of Purple. Somewhere beyond the great hall, the treasure is vanishing faster than any wagon could carry it.\n\nIvy, your thief\'s eye marks the patrol gaps. Thorn, you catch a snatch of Draconic — something about "the next gate opening at dusk."\n\nWhat do you do?\n\n***\n**Campaign State:**\nLocation: Castle Naerytar\nTime: Day 60, 08:00 AM\nStatus: Infiltrated in disguise — hunting the hoard\'s exit', ts: 1, gameTs: 'Day 60, 08:00 AM', playerName: null, partial: false, mechanics: { applied: [{ key: 'location', value: 'Castle Naerytar', applied: true }, { key: 'time', value: 'Day 60, 08:00 AM', applied: true }], rejected: [] } },
  ];
  c.ooc = [];

  c.quests = [
    { id: 'q1', text: 'Infiltrate Castle Naerytar disguised as laborers', status: 'active', location: 'Castle Naerytar', giverNpc: 'Leosin Erlanthar', notes: 'Wear the cult robes from the lodge.', gameTs: 'Day 58' },
    { id: 'q2', text: 'Find where the hoard is being moved', status: 'active', location: 'Castle Naerytar', giverNpc: '', notes: 'Wyrmlings mentioned a portal in the bog.', gameTs: 'Day 59' },
    { id: 'q3', text: 'Free the captive prisoners in the keep', status: 'active', location: 'Castle Naerytar', giverNpc: '', notes: '', gameTs: 'Day 60' },
    { id: 'q4', text: 'Report the cult\'s movements to the Harpers', status: 'active', location: '', giverNpc: 'Leosin Erlanthar', notes: '', gameTs: 'Day 40' },
    { id: 'q5', text: 'Save the mill at Greenest', status: 'done', location: 'Greenest', giverNpc: 'Gov. Nighthill', notes: '', gameTs: 'Day 2' },
    { id: 'q6', text: 'Rescue the prisoners in the Greenest keep', status: 'done', location: 'Greenest Keep', giverNpc: 'Escobert', notes: '', gameTs: 'Day 3' },
    { id: 'q7', text: 'Defeat Langdedrosa Cyanwrath in single combat', status: 'failed', location: 'Greenest', giverNpc: '', notes: 'He bested our champion.', gameTs: 'Day 3' },
    { id: 'q8', text: 'Track the raiders\' camp', status: 'done', location: 'Raider Camp', giverNpc: 'Nighthill', notes: '', gameTs: 'Day 5' },
  ];

  c.consequences = [
    { id: 'c1', text: 'Pursuers from the hunting lodge are on your trail.', type: 'threat', resolved: false, gameTs: 'Day 59', location: 'Castle Naerytar', deadline: 'tonight' },
    { id: 'c2', text: 'The cult\'s ritual reaches its next phase.', type: 'faction', resolved: false, gameTs: 'Day 58', location: '', deadline: '2d' },
    { id: 'c3', text: 'Your disguises will be questioned at the next muster.', type: 'environmental', resolved: false, gameTs: 'Day 60', location: 'Castle Naerytar', deadline: '' },
    { id: 'c4', text: 'Structural damage to the keep\'s east wall could collapse.', type: 'environmental', resolved: false, gameTs: 'Day 60', location: 'Castle Naerytar', deadline: '' },
    { id: 'c5', text: 'Greenest expects your return as promised.', type: 'faction', resolved: true, resolvedTs: 'Day 40', gameTs: 'Day 6', location: 'Greenest' },
  ];

  c.npcs = [
    { id: 'n1', name: 'Leosin Erlanthar', disposition: 'Friendly', details: 'Harper monk you rescued from the lodge.', status: 'active', hp: null, lastSeen: 'Greenest', race: 'Half-Elf', role: 'Harper agent', gameTs: 'Day 8' },
    { id: 'n2', name: 'Gov. Nighthill', disposition: 'Friendly', details: 'Governor of Greenest.', status: 'active', hp: null, lastSeen: 'Greenest Keep', race: 'Human', role: 'governor', gameTs: 'Day 1' },
    { id: 'n3', name: 'Castellan Escobert', disposition: 'Friendly', details: 'Keeper of the keep, knows its tunnels.', status: 'active', hp: null, lastSeen: 'Greenest Keep', race: 'Dwarf', role: 'castellan', gameTs: 'Day 1' },
    { id: 'n4', name: 'Wearer of Purple', disposition: 'Hostile', details: 'A cult commander in violet robes.', status: 'active', hp: 45, lastSeen: 'Castle Naerytar', race: 'Human', role: 'cult commander', gameTs: 'Day 60' },
    { id: 'n5', name: 'Langdedrosa Cyanwrath', disposition: 'Hostile', details: 'Blue half-dragon champion of the cult.', status: 'active', hp: 85, lastSeen: 'Raider Camp', race: 'Half-Dragon', role: 'champion', gameTs: 'Day 3' },
    { id: 'n6', name: 'Rath Modar', disposition: 'Hostile', details: 'Red Wizard advising the cult.', status: 'active', hp: 40, lastSeen: 'Castle Naerytar', race: 'Human', role: 'red wizard', gameTs: 'Day 60' },
    { id: 'n7', name: 'Frulam Mondath', disposition: 'Neutral', details: 'Cult priestess, current whereabouts unknown.', status: 'active', hp: null, lastSeen: 'Hunting Lodge', race: 'Human', role: 'priestess', gameTs: 'Day 40' },
    { id: 'n8', name: 'Snapjaw', disposition: 'Neutral', details: 'A lizardfolk who may be turned against the bullywugs.', status: 'active', hp: 22, lastSeen: 'Castle Naerytar bog', race: 'Lizardfolk', role: 'potential ally', gameTs: 'Day 60' },
    { id: 'n9', name: 'Captain Othelstan', disposition: 'Unknown', details: 'Commands the castle guard.', status: 'active', hp: null, lastSeen: 'Castle Naerytar', race: 'Human', role: 'guard captain', gameTs: 'Day 60' },
  ];

  c.locations = [
    { id: 'l1', name: 'Greenest', type: 'town', status: 'visited', firstVisited: 'Day 1', lastVisited: 'Day 6', rep: { disposition: 'Friendly', notes: 'Saved from the raid.' }, npcs: ['Gov. Nighthill', 'Castellan Escobert'], investments: [], history: [{ gameTs: 'Day 1', text: 'Arrived during the dragon raid.', dmOnly: false }, { gameTs: 'Day 3', text: 'Defended the keep through the night.', dmOnly: false }], dmNotes: '', playerNotes: 'They owe us.', mapPos: null },
    { id: 'l2', name: 'Raider Camp', type: 'camp', status: 'visited', firstVisited: 'Day 5', lastVisited: 'Day 6', rep: { disposition: 'Hostile', notes: '' }, npcs: ['Langdedrosa Cyanwrath'], investments: [], history: [{ gameTs: 'Day 5', text: 'Infiltrated the camp.', dmOnly: false }], dmNotes: '', playerNotes: '', mapPos: null },
    { id: 'l3', name: 'Hunting Lodge', type: 'dungeon', status: 'visited', firstVisited: 'Day 40', lastVisited: 'Day 58', rep: { disposition: 'Hostile', notes: '' }, npcs: ['Frulam Mondath'], investments: [], history: [{ gameTs: 'Day 58', text: 'Rescued Leosin; took cult robes.', dmOnly: false }], dmNotes: '', playerNotes: '', mapPos: null },
    { id: 'l4', name: 'Castle Naerytar', type: 'dungeon', status: 'visited', firstVisited: 'Day 60', lastVisited: 'Day 60', rep: { disposition: 'Neutral', notes: 'Posing as laborers.' }, npcs: ['Wearer of Purple', 'Rath Modar', 'Snapjaw'], investments: [], history: [{ gameTs: 'Day 60', text: 'Entered disguised among the laborers.', dmOnly: false }], dmNotes: 'Portal in the bog.', playerNotes: '', mapPos: null },
  ];

  c.townReputation = [
    { town: 'Greenest', status: 'Friendly', notes: 'The town\'s primary defenders.', gameTs: 'Day 6', history: [] },
    { town: 'Castle Naerytar', status: 'Neutral', notes: 'Currently posing as laborers to blend in.', gameTs: 'Day 60', history: [] },
    { town: 'Elturel', status: 'Friendly', notes: 'The Order of the Gauntlet vouches for you.', gameTs: 'Day 30', history: [] },
  ];

  c.secrets = [
    { id: 's1', text: 'The cult is moving the hoard through a teleportation portal hidden in the bog.', playerKnown: true, aiOnly: false, category: 'plot', source: 'Overheard wyrmlings', gameTs: 'Day 60' },
    { id: 's2', text: 'Snapjaw resents the bullywugs and could be turned to your side.', playerKnown: true, aiOnly: false, category: 'npc', source: 'Conversation in the bog', gameTs: 'Day 60' },
    { id: 's3', text: 'Rath Modar serves his own Red Wizard agenda, not the cult\'s.', playerKnown: true, aiOnly: false, category: 'npc', source: 'Intercepted letter', gameTs: 'Day 60' },
  ];

  c.chapters = [
    { id: 1, title: 'Greenest in Flames', content: 'The party arrived as a blue dragon and raiders sacked the town; they saved the mill, the keep, and many townsfolk.', gameTs: 'Day 1–3' },
    { id: 2, title: 'The Raiders\' Camp', content: 'Infiltrated the cult camp, learned of the hoard, and clashed with Cyanwrath.', gameTs: 'Day 5–6' },
    { id: 3, title: 'The Hunting Lodge', content: 'Rescued the Harper Leosin and took cult disguises.', gameTs: 'Day 40–58' },
    { id: 4, title: 'Castle Naerytar', content: 'Entered the bog-fortress posing as laborers, hunting the portal.', gameTs: 'Day 60' },
  ];

  c.characters[0].familiar = {
    name: 'Quill',
    species: 'Owl',
    type: 'Fey',
    size: 'Tiny',
    hp: 1,
    hpMax: 1,
    ac: 11,
    speeds: { walk: 5, fly: 60 },
    abilities: { str: 3, dex: 13, con: 8, int: 2, wis: 12, cha: 7 },
    senses: 'Darkvision 120 ft.',
    skills: 'Perception +3, Stealth +3',
    passivePerception: 13,
    specialAbilities: [
      { name: 'Flyby', description: 'The owl doesn\'t provoke opportunity attacks when it flies out of an enemy\'s reach.' },
      { name: 'Keen Hearing & Sight', description: 'The owl has advantage on Wisdom (Perception) checks that rely on hearing or sight.' },
    ],
    status: 'active',
    source: 'Wild companion met on the trade road',
  };

  // Per-PC carried inventory + wagon + hoard so Cargo populates across owners.
  c.inventory = {
    carried: {
      pc_ivy: [
        { name: 'Rapier', qty: 1, type: 'weapon', weight: 2 },
        { name: 'Shortbow', qty: 1, type: 'weapon', weight: 2 },
        { name: 'Arrows', qty: 40, type: 'ammo', weight: 0.05 },
        { name: 'Thieves\' Tools', qty: 1, type: 'tool', weight: 1 },
        { name: 'Cult Robes (disguise)', qty: 1, type: 'clothing', weight: 4 },
        { name: 'Lodge Gate Bypass Token', qty: 1, type: 'key', weight: 0 },
        { name: 'Smokepowder Pouch', qty: 2, type: 'consumable', weight: 1 },
      ],
      pc_thorn: [
        { name: 'Rapier', qty: 1, type: 'weapon', weight: 2 },
        { name: 'Lute', qty: 1, type: 'instrument', weight: 2 },
        { name: 'Red Wizard Robes', qty: 1, type: 'clothing', weight: 4 },
        { name: 'Spellbook of Cuttings', qty: 1, type: 'gear', weight: 3 },
        { name: 'Letters to Severin', qty: 3, type: 'document', weight: 0 },
        { name: 'Ghost-Cap Mushroom', qty: 8, type: 'herb', weight: 0 },
      ],
    },
    wagon: [
      { name: 'Rope (50ft)', qty: 2, type: 'gear', weight: 10 },
      { name: 'Rations', qty: 22, type: 'consumable', weight: 2 },
      { name: 'Healing Potion', qty: 5, type: 'potion', weight: 0.5 },
      { name: 'Alchemical Fire', qty: 3, type: 'consumable', weight: 1 },
      { name: 'Cult Deployment Orders', qty: 1, type: 'document', weight: 0 },
      { name: 'Basalt Power-Shard', qty: 6, type: 'component', weight: 1 },
    ],
    hoard: [
      { name: 'Cultist Coin Cache', qty: 1, type: 'currency', weight: 6 },
      { name: 'Jeweled Dragon Mask', qty: 1, type: 'hoard', weight: 3 },
      { name: 'Chain Shirts (cult issue)', qty: 8, type: 'armor', weight: 20 },
      { name: 'Frost-Heart Root', qty: 6, type: 'herb', weight: 0 },
    ],
  };

  setStore('campaign', c);
  setStore('system', 'activeCampaignId', 'demo_full');
}
