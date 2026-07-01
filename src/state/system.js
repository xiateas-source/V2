export const DEFAULT_SYSTEM = {
  playerIdentity: {
    name: '',
    selectedPCs: [],
    mode: 'single',
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
};
