// ═══════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO DE ANÚNCIOS
// ═══════════════════════════════════════════════════════════════════
//
// Cole aqui o código HTML/JS dos seus anúncios (Adsterra, PropellerAds, etc.)
// Deixe VAZIO "" nos slots que ainda não criou.
//
// Exemplo com Adsterra (banner 728x90):
//   ADSTERRA: <iframe src="https://... " width="728" height="90"></iframe>
//
// ═══════════════════════════════════════════════════════════════════

export const AD_SLOTS: Record<string, string> = {

  // ── DASHBOARD ─────────────────────────────────────────────────
  'dashboard-topo': ``,
  'dashboard-sidebar': ``,
  'dashboard-rodape': ``,

  // ── REDAÇÃO ───────────────────────────────────────────────────
  'redacao-topo': ``,
  'redacao-rodape': ``,

  // ── PERGUNTAS ─────────────────────────────────────────────────
  'perguntas-topo': ``,
  'perguntas-meio': ``,
  'perguntas-rodape': ``,

  // ── SIMULADOS ─────────────────────────────────────────────────
  'simulados-topo': ``,
  'simulados-rodape': ``,

  // ── APRENDIZADO ───────────────────────────────────────────────
  'aprendizado-topo': ``,
  'aprendizado-sidebar': ``,
  'aprendizado-lesson-sidebar': ``,
  'aprendizado-rodape': ``,

  // ── CONFIGURAÇÕES ─────────────────────────────────────────────
  'configuracoes-topo': ``,
  'configuracoes-meio': ``,
  'configuracoes-rodape': ``,

  // ── POPUNDER (carrega uma vez ao entrar) ─────────────────────
  'popunder': ``,
};

export function hasAdSlotsConfigured(): boolean {
  return Object.values(AD_SLOTS).some(code => code.trim().length > 0);
}
