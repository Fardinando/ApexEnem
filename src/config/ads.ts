// ═══════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO DE ANÚNCIOS — AdSense
// ═══════════════════════════════════════════════════════════════════
//
// IMPORTANTE: cole apenas a tag <ins> que o AdSense gerar.
// NÃO cole as tags <script> — o app já carrega o script no <head>
// e já chama (adsbygoogle.push) automaticamente.
//
// Exemplo correto:
//   `<ins class="adsbygoogle"
//      style="display:inline-block;width:728px;height:90px"
//      data-ad-client="ca-pub-3858534603619694"
//      data-ad-slot="1234567890"></ins>`
//
// Deixe VAZIO "" nos slots que ainda não criou.
// ═══════════════════════════════════════════════════════════════════

export const AD_SLOTS: Record<string, string> = {

  // ── DASHBOARD ─────────────────────────────────────────────────
  'dashboard-topo': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="2848592983"></ins>`,

  'dashboard-sidebar': `<ins class="adsbygoogle"
     style="display:inline-block;width:300px;height:250px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="7909347973"></ins>`,

  'dashboard-rodape': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="9492680932"></ins>`,

  // ── REDAÇÃO ───────────────────────────────────────────────────
  'redacao-topo': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="8136578681"></ins>`,

  'redacao-rodape': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="4197333675"></ins>`,

  // ── PERGUNTAS ─────────────────────────────────────────────────
  'perguntas-topo': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="3944840784"></ins>`,

  'perguntas-meio': `<ins class="adsbygoogle"
     style="display:inline-block;width:468px;height:60px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="9258088660"></ins>`,

  'perguntas-rodape': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="9005595771"></ins>`,

  // ── SIMULADOS ─────────────────────────────────────────────────
  'simulados-topo': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="7945006993"></ins>`,

  'simulados-rodape': `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="8698052557"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>`,

  // ── APRENDIZADO ───────────────────────────────────────────────
  'aprendizado-topo': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="1989595433"></ins>`,

  'aprendizado-sidebar': `<ins class="adsbygoogle"
     style="display:inline-block;width:300px;height:250px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="6866517593"></ins>`,

  'aprendizado-lesson-sidebar': `<ins class="adsbygoogle"
     style="display:inline-block;width:160px;height:600px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="8363432093"></ins>`,

  'aprendizado-rodape': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="5737268757"></ins>`,

  // ── CONFIGURAÇÕES ─────────────────────────────────────────────
  'configuracoes-topo': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="4424187088"></ins>`,

  'configuracoes-meio': `<ins class="adsbygoogle"
     style="display:inline-block;width:300px;height:250px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="3111105414"></ins>`,

  'configuracoes-rodape': `<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="1798023746"></ins>`,

  // ── REWARDED (overlay) ──────────────────────────────────────
  'rewarded': `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="5709348592"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>`,
};

const envId = typeof import.meta.env !== 'undefined' ? (import.meta.env as any).VITE_ADSENSE_PUBLISHER_ID : undefined;
export const ADSENSE_PUBLISHER_ID = envId || "3858534603619694";
