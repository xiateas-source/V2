export const DEFAULT_SYSTEM = {
  playerIdentity: {
    name: '',
    selectedPCs: [],
    mode: 'single',
    npcName: '',
  },

  multiplay: {
    role: 'solo',   // 'solo' | 'guest'
    hostUid: '',    // set when role === 'guest'
  },

  settings: {
    theme: 'dark-0',
    largeText: false,
    ttsEnabled: false,
    ttsVoice: null,
    pushEnabled: false,
    pushSubscription: null,
    quickActions: {
      active: ['short_rest', 'long_rest', 'dodge', 'dash', 'search', 'stealth'],
      custom: [],
      mode: 'instant',
    },
  },

  providers: {
    primary: 'gemini',
    geminiModel: 'gemini-3.1-flash-lite',
    geminiKey: '',
    openrouterKey: '',
    lastProvider: '',
    health: {},
  },

  activeCampaignId: '',

  // Dev/QA scratch space (MechTest.jsx's Testing Notes) — local-only, not
  // campaign data, survives closing the testing tab and New Campaign resets.
  testerNotes: '',
};
