// ═══════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO DE ANÚNCIOS — AdSense
// ═══════════════════════════════════════════════════════════════════
//
// COMO USAR:
// 1. Crie cada unidade de anúncio no Google AdSense
// 2. Copie o código <ins>...</ins> que o AdSense gerar
// 3. Cole no slot correspondente abaixo, DENTRO das crases `` 
//
// Não precisa colar o <script> nem o push — o app já faz isso.
// Basta o <ins> com data-ad-slot correto.
//
// Exemplo do que colar:
//   `<ins class="adsbygoogle"
//      style="display:block"
//      data-ad-client="ca-pub-3858534603619694"
//      data-ad-slot="1234567890"
//      data-ad-format="auto"
//      data-full-width-responsive="true"></ins>`
//
// Deixe a string VAZIA "" nos slots que ainda não criou.
// ═══════════════════════════════════════════════════════════════════

export const AD_SLOTS: Record<string, string> = {

  // ── DASHBOARD ─────────────────────────────────────────────────
  'dashboard-topo': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'dashboard-sidebar': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'dashboard-rodape': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  // ── REDAÇÃO ───────────────────────────────────────────────────
  'redacao-topo': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'redacao-rodape': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  // ── PERGUNTAS ─────────────────────────────────────────────────
  'perguntas-topo': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'perguntas-meio': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'perguntas-rodape': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  // ── SIMULADOS ─────────────────────────────────────────────────
  'simulados-topo': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'simulados-rodape': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  // ── APRENDIZADO ───────────────────────────────────────────────
  'aprendizado-topo': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'aprendizado-sidebar': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'aprendizado-lesson-sidebar': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'aprendizado-rodape': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  // ── CONFIGURAÇÕES ─────────────────────────────────────────────
  'configuracoes-topo': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'configuracoes-meio': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  'configuracoes-rodape': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,

  // ── REWARDED (anúncio dentro do overlay) ──────────────────────
  'rewarded': `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-3858534603619694"
      data-ad-slot=""
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>`,
};

// publisher ID (sem "ca-pub-")
export const ADSENSE_PUBLISHER_ID = "3858534603619694";
