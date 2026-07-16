export interface AdSlot {
  code: string;
  width: number;
  height: number;
}

export const AD_SLOTS: Record<string, AdSlot> = {

  // ── SOCIAL BAR (carrega uma vez no app) ────────────────────────
  socialbar: {
    code: `<script src="https://pl30323980.effectivecpmnetwork.com/f0/52/e9/f052e9422084a69205d7decf041aabab.js"></script>`,
    width: 0,
    height: 0,
  },

  // ── SMARTLINK (redirect URL) ──────────────────────────────────
  smartlink_url: {
    code: `https://www.effectivecpmnetwork.com/c0wk6m25f0?key=5438e836339cdee7370c0f68bcb24d00`,
    width: 0,
    height: 0,
  },

  // ── NATIVE BANNER ─────────────────────────────────────────────
  nativo: {
    code: `<script async="async" data-cfasync="false" src="https://pl30323978.effectivecpmnetwork.com/8f3532e92d5eb66bde3a8751ee0a6089/invoke.js"></script><div id="container-8f3532e92d5eb66bde3a8751ee0a6089"></div>`,
    width: 300,
    height: 250,
  },

  // ── DASHBOARD ─────────────────────────────────────────────────
  'dashboard-topo': {
    code: `<script>atOptions={'key':'6ebafb4bb07f31c30bdc90eda41e1134','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/6ebafb4bb07f31c30bdc90eda41e1134/invoke.js"></script>`,
    width: 728,
    height: 90,
  },
  'dashboard-sidebar': {
    code: `<script>atOptions={'key':'e2cded58a320b50ccf5f6ff214bb8d08','format':'iframe','height':250,'width':300,'params':{}};</script><script src="https://www.highperformanceformat.com/e2cded58a320b50ccf5f6ff214bb8d08/invoke.js"></script>`,
    width: 300,
    height: 250,
  },
  'dashboard-conteudo': {
    code: `<script>atOptions={'key':'26dac0f773defb16adff327a1f6b73be','format':'iframe','height':300,'width':160,'params':{}};</script><script src="https://www.highperformanceformat.com/26dac0f773defb16adff327a1f6b73be/invoke.js"></script>`,
    width: 160,
    height: 300,
  },
  'dashboard-rodape': {
    code: `<script>atOptions={'key':'9cbbb203f3ef751f5b5187b626853850','format':'iframe','height':60,'width':468,'params':{}};</script><script src="https://www.highperformanceformat.com/9cbbb203f3ef751f5b5187b626853850/invoke.js"></script>`,
    width: 468,
    height: 60,
  },

  // ── REDAÇÃO ───────────────────────────────────────────────────
  'redacao-topo': {
    code: `<script>atOptions={'key':'6ebafb4bb07f31c30bdc90eda41e1134','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/6ebafb4bb07f31c30bdc90eda41e1134/invoke.js"></script>`,
    width: 728,
    height: 90,
  },
  'redacao-conteudo': {
    code: `<script>atOptions={'key':'9e4ef98b32e0667423ec5db23f15094e','format':'iframe','height':600,'width':160,'params':{}};</script><script src="https://www.highperformanceformat.com/9e4ef98b32e0667423ec5db23f15094e/invoke.js"></script>`,
    width: 160,
    height: 600,
  },
  'redacao-rodape': {
    code: `<script>atOptions={'key':'9cbbb203f3ef751f5b5187b626853850','format':'iframe','height':60,'width':468,'params':{}};</script><script src="https://www.highperformanceformat.com/9cbbb203f3ef751f5b5187b626853850/invoke.js"></script>`,
    width: 468,
    height: 60,
  },

  // ── PERGUNTAS ─────────────────────────────────────────────────
  'perguntas-topo': {
    code: `<script>atOptions={'key':'6ebafb4bb07f31c30bdc90eda41e1134','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/6ebafb4bb07f31c30bdc90eda41e1134/invoke.js"></script>`,
    width: 728,
    height: 90,
  },
  'perguntas-meio': {
    code: `<script async="async" data-cfasync="false" src="https://pl30323978.effectivecpmnetwork.com/8f3532e92d5eb66bde3a8751ee0a6089/invoke.js"></script><div id="container-8f3532e92d5eb66bde3a8751ee0a6089"></div>`,
    width: 300,
    height: 250,
  },
  'perguntas-rodape': {
    code: `<script>atOptions={'key':'9cbbb203f3ef751f5b5187b626853850','format':'iframe','height':60,'width':468,'params':{}};</script><script src="https://www.highperformanceformat.com/9cbbb203f3ef751f5b5187b626853850/invoke.js"></script>`,
    width: 468,
    height: 60,
  },

  // ── SIMULADOS ─────────────────────────────────────────────────
  'simulados-topo': {
    code: `<script>atOptions={'key':'6ebafb4bb07f31c30bdc90eda41e1134','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/6ebafb4bb07f31c30bdc90eda41e1134/invoke.js"></script>`,
    width: 728,
    height: 90,
  },
  'simulados-conteudo': {
    code: `<script>atOptions={'key':'b6a8ab78e77171caf21881c02c58f5c0','format':'iframe','height':50,'width':320,'params':{}};</script><script src="https://www.highperformanceformat.com/b6a8ab78e77171caf21881c02c58f5c0/invoke.js"></script>`,
    width: 320,
    height: 50,
  },
  'simulados-rodape': {
    code: `<script>atOptions={'key':'9cbbb203f3ef751f5b5187b626853850','format':'iframe','height':60,'width':468,'params':{}};</script><script src="https://www.highperformanceformat.com/9cbbb203f3ef751f5b5187b626853850/invoke.js"></script>`,
    width: 468,
    height: 60,
  },

  // ── APRENDIZADO ───────────────────────────────────────────────
  'aprendizado-topo': {
    code: `<script>atOptions={'key':'6ebafb4bb07f31c30bdc90eda41e1134','format':'iframe','height':90,'width':728,'params':{}};</script><script src="https://www.highperformanceformat.com/6ebafb4bb07f31c30bdc90eda41e1134/invoke.js"></script>`,
    width: 728,
    height: 90,
  },
  'aprendizado-sidebar': {
    code: `<script>atOptions={'key':'e2cded58a320b50ccf5f6ff214bb8d08','format':'iframe','height':250,'width':300,'params':{}};</script><script src="https://www.highperformanceformat.com/e2cded58a320b50ccf5f6ff214bb8d08/invoke.js"></script>`,
    width: 300,
    height: 250,
  },
  'aprendizado-rodape': {
    code: `<script>atOptions={'key':'9cbbb203f3ef751f5b5187b626853850','format':'iframe','height':60,'width':468,'params':{}};</script><script src="https://www.highperformanceformat.com/9cbbb203f3ef751f5b5187b626853850/invoke.js"></script>`,
    width: 468,
    height: 60,
  },

  // ── SIDEBAR ──────────────────────────────────────────────────
  'sidebar-desktop': {
    code: `<script>atOptions={'key':'e2cded58a320b50ccf5f6ff214bb8d08','format':'iframe','height':250,'width':300,'params':{}};</script><script src="https://www.highperformanceformat.com/e2cded58a320b50ccf5f6ff214bb8d08/invoke.js"></script>`,
    width: 300,
    height: 250,
  },
  'sidebar-mobile': {
    code: `<script>atOptions={'key':'b6a8ab78e77171caf21881c02c58f5c0','format':'iframe','height':50,'width':320,'params':{}};</script><script src="https://www.highperformanceformat.com/b6a8ab78e77171caf21881c02c58f5c0/invoke.js"></script>`,
    width: 320,
    height: 50,
  },

  // ── CONFIGURAÇÕES ─────────────────────────────────────────────
  'configuracoes-topo': {
    code: `<script>atOptions={'key':'b6a8ab78e77171caf21881c02c58f5c0','format':'iframe','height':50,'width':320,'params':{}};</script><script src="https://www.highperformanceformat.com/b6a8ab78e77171caf21881c02c58f5c0/invoke.js"></script>`,
    width: 320,
    height: 50,
  },
  'configuracoes-meio': {
    code: `<script>atOptions={'key':'e2cded58a320b50ccf5f6ff214bb8d08','format':'iframe','height':250,'width':300,'params':{}};</script><script src="https://www.highperformanceformat.com/e2cded58a320b50ccf5f6ff214bb8d08/invoke.js"></script>`,
    width: 300,
    height: 250,
  },
  'configuracoes-rodape': {
    code: `<script>atOptions={'key':'9cbbb203f3ef751f5b5187b626853850','format':'iframe','height':60,'width':468,'params':{}};</script><script src="https://www.highperformanceformat.com/9cbbb203f3ef751f5b5187b626853850/invoke.js"></script>`,
    width: 468,
    height: 60,
  },
};

export const SPECIAL_ADS = ['socialbar'];
export const SMARTLINK_SLOT = 'smartlink_url';

export function hasAdSlotsConfigured(): boolean {
  return Object.entries(AD_SLOTS).some(
    ([key, slot]) => !SPECIAL_ADS.includes(key) && key !== SMARTLINK_SLOT && slot.code.trim().length > 0
  );
}

export const VIDEO_AD_CONFIG = {
  enabled: true,
  intervalActions: 3,
  duration: 10,
  tagUrl: '',
};
