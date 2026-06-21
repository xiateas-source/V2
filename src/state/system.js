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
  },

  providers: {
    primary: 'gemini',
    geminiKey: '',
    openrouterKey: '',
    lastProvider: '',
    health: {},
  },

  activeCampaignId: '',
};
