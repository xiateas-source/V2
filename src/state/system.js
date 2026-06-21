export const DEFAULT_SYSTEM = {
  playerIdentity: {
    name: '',
    selectedPCs: [],
    mode: 'single',
  },

  settings: {
    theme: 'dark-0',
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
