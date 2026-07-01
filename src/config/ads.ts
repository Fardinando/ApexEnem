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
    'dashboard-topo': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- DashboardTopo -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="2848592983"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,


    'dashboard-sidebar': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- DashboardSidebar -->
<ins class="adsbygoogle"
     style="display:inline-block;width:300px;height:250px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="7909347973"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,


    'dashboard-rodape': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- DashboardRodape -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="9492680932"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,


    // ── REDAÇÃO ───────────────────────────────────────────────────
    'redacao-topo': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- RedacaoTopo -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="8136578681"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'redacao-rodape': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- RedacaoRodape -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="4197333675"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    // ── PERGUNTAS ─────────────────────────────────────────────────
    'perguntas-topo': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- PerguntasTopo -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="3944840784"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'perguntas-meio': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- PerguntasMeio -->
<ins class="adsbygoogle"
     style="display:inline-block;width:468px;height:60px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="9258088660"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'perguntas-rodape': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- PerguntasRodape -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="9005595771"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    // ── SIMULADOS ─────────────────────────────────────────────────
    'simulados-topo': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- SimuladosTopo -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="7945006993"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'simulados-rodape': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- SimuladosRodape -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="8698052557"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    // ── APRENDIZADO ───────────────────────────────────────────────
    'aprendizado-topo': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- AprendizadoTopo -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="1989595433"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'aprendizado-sidebar': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- AprendizadoSidebar -->
<ins class="adsbygoogle"
     style="display:inline-block;width:300px;height:250px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="6866517593"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'aprendizado-lesson-sidebar': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- AprendizadoLessonSidebar -->
<ins class="adsbygoogle"
     style="display:inline-block;width:160px;height:600px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="8363432093"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'aprendizado-rodape': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- AprendizadoRodape -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="5737268757"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    // ── CONFIGURAÇÕES ───
    'configuracoes-topo': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- ConfiguracoesTopo -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="4424187088"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'configuracoes-meio': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- ConfiguracoesMeio -->
<ins class="adsbygoogle"
     style="display:inline-block;width:300px;height:250px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="3111105414"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    'configuracoes-rodape': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- ConfiguracoesRodape -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="1798023746"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,


    // ── REWARDED (anúncio dentro do overlay) ──────────────────────
    'rewarded': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3858534603619694"
     crossorigin="anonymous"></script>
<!-- RewardedOverlay -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-3858534603619694"
     data-ad-slot="5709348592"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`,
};


// publisher ID (sem "ca-pub-")
export const ADSENSE_PUBLISHER_ID = "3858534603619694";



