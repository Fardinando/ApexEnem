# Normas que o ApexEnem precisa cumprir — pesquisa consolidada

Documento de referência para o compliance da plataforma, com foco no público jovem (ensino médio) e nas obrigações **em vigor em 2026**. Para cada norma: resumo acionável + o que o ApexEnem precisa implementar ou alterar. Checklist consolidado por prioridade no final.

Marcação:
- 🔴 **Obrigatório por lei** (risco de multa, ação civil pública, suspensão)
- 🟡 **Fortemente recomendado** (boas práticas / exigência de parceiros, p. ex. AdSense)
- 🟢 **Recomendação de maturidade**

---

## 1. ECA Digital — Lei nº 15.211/2025 ("Lei Felca") 🔴

Publicada em **set/2025**, com **vacatio legis de 6 meses**. Vigência plena a partir de **17/03/2026**. Alvo direto: plataformas digitais acessadas por crianças (até 12) e adolescentes (12 a 17). O ApexEnem se enquadra integralmente — seu público-alvo é predominantemente menor de idade.

### Principais obrigações (artigos conforme comentários jurídicos; confirmar na Lex antes de publicar textos legais)

- **Verificação confiável de idade** (Art. 5 / Art. 9) — autodeclaração sozinha **não é aceita**. Precisa de mecanismo complementar: documento, dado bancário do responsável, biometria, cruzamento com base pública etc.
- **Vinculação a responsável legal** para usuários **até 16 anos** (Art. 24) — a conta precisa estar associada a um pai/mãe/responsável que tenha dado consentimento.
- **Controles parentais nativos** — ferramentas para o responsável acompanhar atividade, limitar tempo, bloquear funcionalidades.
- **Proibição de perfilamento publicitário para menores** (Art. 22) — veda publicidade direcionada por comportamento/emoção; proíbe realidade aumentada/virtual com fins comerciais.
- **Remoção extrajudicial de conteúdo** (Art. 29) — mediante notificação da vítima, representante legal, MP ou órgão de defesa dos direitos da criança, **sem necessidade de ordem judicial**.
- **Dever de moderação proativa** sobre conteúdo que exponha menores a risco (abuso, exploração, apologia a autolesão, bullying).
- **Canal de denúncia** acessível e com resposta registrada.
- **Relatórios de transparência semestrais em português** quando a plataforma tem mais de 1 milhão de menores cadastrados (Art. 31).
- **Penalidades** — advertência, multa de até **R$ 50 milhões por infração**, suspensão temporária, proibição de atividade.

### O que o ApexEnem precisa implementar/alterar

- [ ] Fluxo de cadastro com **verificação de idade real** e **vinculação de responsável** para menores de 16: e-mail do responsável, código de confirmação enviado a esse e-mail, aceite de termos pelo responsável.
- [ ] Painel do responsável (dashboard do pai/mãe): resumo de uso, tempo de tela, bloquear chat/IA/anúncios por aluno.
- [ ] Botão "**Denunciar conteúdo / Reportar risco**" visível em redação, chat IA, blog, comentários — SLA interno de 48h.
- [ ] Opt-out de anúncios comportamentais para menores (AdSense **non-personalized ads**) — ver seção 6.
- [ ] Página pública **"/transparencia"** com relatório semestral (quando atingir 1M menores).
- [ ] Política de moderação documentada (quem avalia, prazo, critérios).
- [ ] Atualizar Termos e Política de Privacidade com cláusula específica "Crianças e Adolescentes — ECA Digital".

---

## 2. LGPD — Art. 14 (dados de crianças e adolescentes) 🔴

Lei 13.709/2018. O **Enunciado CD/ANPD nº 1/2023** permite usar as bases legais dos Arts. 7 e 11 para menores desde que respeitado o **melhor interesse**.

- **§1º** — processamento de dados de **crianças (até 12 anos)** exige **consentimento específico e destacado** de pelo menos um dos pais/responsáveis. Cláusula genérica dentro de um TOS não cumpre.
- **Caput** — princípio do **melhor interesse** aplica-se a **todos os menores** (até 17).
- **§3º** — proíbe processar dados de criança para publicidade direcionada e perfilamento comportamental. Esse veto **não pode ser contornado por consentimento parental**.
- **ANPD já aplicou sanções** a secretarias de educação por uso de Google Forms com dados de saúde de ~3 mil crianças sem RIPD, ROPA e treinamento (jan/2024).
- **Dados mínimos** — coletar apenas o necessário; a plataforma pergunta região, estado, cidade, série e meta: justificar cada campo ou torná-los opcionais.

### O que o ApexEnem precisa implementar/alterar

- [ ] Fluxo de **consentimento específico e destacado**: tela separada, checkbox dedicado, texto curto e claro — não enterrar no TOS.
- [ ] Para menores de 12: **confirmação por e-mail do responsável** antes de ativar a conta.
- [ ] Separar os banners de cookies em: essenciais / analytics / **publicidade** — e para menores a opção de publicidade deve vir **desligada por padrão e desabilitada** (ver §3º).
- [ ] **RIPD** (Relatório de Impacto) formal se houver tratamento de alto risco (IA que lê redação, cruzamento de desempenho).
- [ ] **ROPA** (Registro de operações de tratamento) por sistema: Supabase, Vercel, Render, OpenRouter, Gemini, AdSense, GA.
- [ ] **DPO/Encarregado** nomeado e e-mail público (hoje é `apexenem@gmail.com` — ok, mas deixe explícito no rodapé).
- [ ] Direitos do titular: endpoint de **exportar meus dados** e **excluir conta** (último já existe, bom).

---

## 3. Marco Civil da Internet — Lei 12.965/2014 🔴

Regulamentado pelo Decreto 8.771/2016.

- **Art. 15** — provedor de aplicação pessoa jurídica, com fins econômicos, deve guardar **registros de acesso a aplicações por 6 meses** em ambiente controlado e seguro.
- **Art. 13** — provedor de **conexão** guarda registros de conexão por 1 ano (não se aplica ao ApexEnem, que é aplicação).
- Autoridades (polícia, administrativa, MP) podem **solicitar extensão** do prazo.
- **Divulgação** dos registros só mediante **ordem judicial**.
- **Art. 7** — direitos do usuário: inviolabilidade e sigilo das comunicações, informações claras nos contratos, não fornecimento a terceiros sem consentimento.
- **Art. 19** — regra geral: provedor só responde por conteúdo de terceiro após ordem judicial específica. **ATENÇÃO:** essa regra foi parcialmente mitigada pelo STF em 2024/2025 (RE 1.057.258) para conteúdos manifestamente ilícitos e para violações aos direitos de criança/adolescente — ECA Digital já reforça isso.

### O que o ApexEnem precisa implementar/alterar

- [ ] Pipeline de **log de acesso** (IP, user_id, user-agent, timestamp, rota) por **≥ 6 meses** com acesso restrito. Supabase/Vercel geram parte disso; verificar retenção.
- [ ] Procedimento interno para resposta a **ordem judicial** (fluxo + modelo de resposta).
- [ ] Página clara de **"Transparência e requisições governamentais"** (recomendação de maturidade).
- [ ] Logs **imutáveis** (append-only) ou com hash de integridade — boa prática pericial.

---

## 4. CDC — Código de Defesa do Consumidor (Lei 8.078/1990) 🟡/🔴

Aplicável a qualquer relação de consumo online — e-commerce, assinatura, serviço gratuito com monetização por ads também.

- **Art. 49** — **direito de arrependimento de 7 dias corridos** para compras fora do estabelecimento (internet inclusive), contados da assinatura ou do recebimento, **sem necessidade de justificativa** e **sem custo** para o consumidor.
- Reembolso **imediato** com correção monetária.
- Informação **clara** sobre preço, características, prazo, canal de atendimento.
- Site precisa exibir **CNPJ, razão social, endereço físico** da empresa.
- SAC acessível — telefone/e-mail/formulário com resposta registrada.

### O que o ApexEnem precisa implementar/alterar

- [ ] Enquanto não há plano pago, isenção de boa parte dessas obrigações. **No dia em que ligar o checkout**:
  - Botão "Cancelar minha assinatura" com reembolso automático em até 7 dias.
  - E-mail de confirmação do pagamento com nota fiscal.
  - Preço final destacado (R$ XX,XX **por mês/ano**), sem taxas escondidas.
- [ ] **Rodapé** com CNPJ, razão social, endereço e e-mail de contato. (Se o CNPJ ainda não existe, criar MEI/LTDA antes do primeiro pagamento recebido — crítico.)
- [ ] Página **/contato** com SAC — já existe, bom. Adicionar prazo de resposta.
- [ ] Página **/reembolso** — já existe. Revisar texto para alinhar ao Art. 49.

---

## 5. Pagamentos — Pix e meios financeiros 🟡

Enquanto o ApexEnem for 100% grátis, não aplica. Quando ligar o checkout:

- **Pix** não precisa de credenciamento próprio no BACEN se usar PSP (gateway) — a pessoa jurídica recebedora precisa só de CNPJ e chave Pix vinculada.
- **Instrução Normativa BCB 291/2022** regula apenas quem atua como **iniciador** (não é o caso de aceitar Pix via Stripe/Mercado Pago/Pagar.me).
- **Pix Automático** obrigatório desde 13/10/2025 para débito recorrente — se oferecer plano mensal, idealmente usar Pix Automático ou cartão.
- **PCI DSS** — se nunca tocar no número do cartão (usar tokenização do gateway, forma recomendada), fica em **SAQ A** (mais simples). Nunca armazenar PAN/CVV.

### O que o ApexEnem precisa implementar/alterar

- [ ] Escolher gateway (Mercado Pago, Stripe BR, Pagar.me) e usar **tokens** — não tocar em cartão cru.
- [ ] **Nota fiscal eletrônica** emitida automaticamente (gateway já integra).
- [ ] Reconciliação diária de pagamentos (webhook do gateway → tabela `payments`).
- [ ] Idempotência nas chamadas de pagamento (impede dupla cobrança).

---

## 6. Google AdSense + público adolescente 🟡

Google é signatário do **compromisso com o ECA Digital** e, por sua vez, exige dos publishers:

- **Child-directed content policy** — se o conteúdo é dirigido a menores, o publisher deve marcar como tal e o Google serve apenas **anúncios não personalizados**.
- Mesmo não sendo child-directed, se o **usuário é menor** e isso é conhecido, o publisher deve propagar o flag `np=1` (non-personalized) nas chamadas de ad.
- **Veto a conteúdos pesados** (apostas, álcool, armas, adulto) em páginas infantis/teen.
- Possível **demonetização** em caso de violação, com histórico de ações do MPSP (2019) contra Google.

### O que o ApexEnem precisa implementar/alterar

- [ ] Enviar `tagForChildDirectedTreatment` (**TFCD**) ou `tagForUnderAgeOfConsent` (**TFUA**) para menores de 16 nas chamadas AdSense.
- [ ] Para menores: nunca servir anúncios de categorias restritas — configurar bloqueios na própria conta AdSense.
- [ ] Preferir anúncios **contextuais** (não comportamentais) para todos os menores (ECA Digital exige, AdSense permite).
- [ ] Nenhuma propaganda em telas de alta sensibilidade (correção de redação, chat de dúvidas) — reduz risco e melhora UX.

---

## 7. CONAR — Resolução Conanda 163/2014 + Código CONAR 🟡

- **Art. 37 do Código CONAR** veda apelos imperativos de consumo a crianças, modelos infantis em anúncios incompatíveis, e desvaloriza valores sociais positivos.
- A **Resolução Conanda 163/2014** considera **abusiva toda publicidade dirigida à criança** (até 12). Há divergência sobre força vinculante, mas Procon e MP a usam como fundamento.
- Para **adolescentes (12-17)**, publicidade é permitida com **cuidados**: nunca estimular consumo compulsivo, não explorar inexperiência, não vincular produto à autoestima.

### O que o ApexEnem precisa implementar/alterar

- [ ] Revisar criativos próprios (não só AdSense) — nada de "compre agora", "oferta acaba em…" para teens.
- [ ] Qualquer **copy do Pricing / Upgrade** deve ser factual e sem gatilho emocional pesado.
- [ ] Promoções não podem **premiar ação compulsiva** (ex.: "assista 50 vídeos e ganhe X").

---

## 8. Direito autoral e marca — uso do nome "ENEM" 🔴/🟡

**Risco a mitigar.** ENEM é marca do INEP (autarquia federal). Pesquisas no INPI confirmam registros em classes de "ensino" e "serviços educacionais".

- **Uso descritivo** ("plataforma para o ENEM", "preparatório para ENEM") é tolerado pela doutrina como **uso de boa-fé referencial** — assim como "aulas para OAB" ou "curso para ENEM" existentes no mercado há décadas.
- **Uso como marca própria** (ex.: logotipo "ApexEnem" fundindo com o nome oficial) tem **risco de confusão** e pode gerar **oposição no INPI** se tentarmos registrar.
- **Logo oficial do ENEM/INEP** — não pode ser usado em marketing sem autorização.
- **Provas do ENEM** — Lei 9.610/1998 (Direito Autoral). O INEP disponibiliza provas e gabaritos em domínio público via portal. Pode usar; não pode distribuir provas **vazadas** ou com marca d'água de outras plataformas.

### O que o ApexEnem precisa implementar/alterar

- [ ] **Nunca usar o logotipo oficial do ENEM/INEP** no site, redes ou materiais.
- [ ] Rodapé com disclaimer: "ApexEnem não possui vínculo com o INEP ou com o Ministério da Educação. ENEM é marca registrada do INEP."
- [ ] Consultar advogado especializado antes de depositar "ApexEnem" no INPI (**classe 41** — educação). Avaliar se o composto "Apex + Enem" ainda tem registrabilidade ou se melhor reposicionar.
- [ ] Garantir que o banco de questões próprio (`src/data/`) **não copia provas inéditas** nem material de terceiros sem licença — usar exclusivamente provas antigas do portal INEP e questões próprias.

---

## 9. Decreto 11.025/2022 + outras normas setoriais 🟡

O **Decreto 11.025/2022** instituiu a **Política Nacional de Governo Digital** e a **Estratégia Federal de Desenvolvimento (ENDE)**. Afeta diretamente só o governo, mas é referência para parcerias (MEC, por exemplo).

- **Portarias do MEC** aplicam-se a quem oferece **educação formal regulada**. Enquanto ApexEnem é "material de apoio" (não emite diploma), não cai no regime do MEC.
- Se futuramente oferecer **"curso livre"** com certificado, enquadra-se como **educação não formal** (Decreto 5.154/2004) — pode emitir certificado próprio sem autorização específica.
- Para **anunciar como "preparatório" ou "cursinho"**, nenhuma autorização especial é necessária.

### O que o ApexEnem precisa implementar/alterar

- [ ] Deixar claro em `/sobre`: "material complementar de estudo", **não** "curso regular".
- [ ] Se emitir certificado futuramente, consulta jurídica para decidir o nome (certificado de participação ≠ diploma).

---

## 10. WCAG 2.2 AA + eMAG 🟡

- **eMAG** (Modelo de Acessibilidade em Governo Eletrônico) só é **obrigatório para sites governamentais** (Decreto 5.296/2004). Não se aplica diretamente ao ApexEnem.
- **Lei Brasileira de Inclusão (Lei 13.146/2015)** — Art. 63 exige acessibilidade em sites "para uso do público em geral". Doutrina discute se se estende a todo site privado; MP já ingressou com ações contra sites que violam. Risco real.
- **WCAG 2.2 AA** — referência técnica adotada mundialmente; não é lei no Brasil mas vira critério em ações civis públicas.

### O que o ApexEnem precisa implementar/alterar (os mais críticos)

- [ ] **Contraste** mínimo 4.5:1 em todo texto. Rodar axe/WAVE e consertar.
- [ ] **Navegação por teclado** completa — nenhuma função só com mouse.
- [ ] **Alt text** em todas as imagens informativas (OnboardingView, LandingPage).
- [ ] **Rótulos de formulário** (`<label>` associado) — AuthView, ConfiguracoesView.
- [ ] **Focus visível** sempre (`:focus-visible` com outline claro).
- [ ] **Legendas** em qualquer vídeo (quando chegar a aba de aulas).
- [ ] **Prefers-reduced-motion** — já está parcialmente implementado via Tailwind.
- [ ] Status/erros com `role="alert"` ou `aria-live`.

---

## Checklist consolidado por prioridade

### 🔴 Crítico — **antes do beta aberto / antes do primeiro pagamento**

1. Fluxo de **verificação de idade + consentimento do responsável** (ECA Digital + LGPD Art. 14).
2. **Painel do responsável** (visão de uso, bloqueios) — ECA Digital.
3. **Botão de denúncia** em conteúdo (ECA Digital Art. 29).
4. **TFUA/TFCD** nas chamadas AdSense para menores de 16.
5. **Disclaimer** no rodapé: "não vinculado ao INEP".
6. **CNPJ + razão social** no rodapé e nos Termos.
7. **Logs de acesso ≥ 6 meses** com acesso restrito (Marco Civil).
8. **DPO/encarregado** publicado (LGPD Art. 41).
9. **ROPA + RIPD** mínimos documentados.
10. Nunca usar logo oficial do INEP/ENEM.
11. **Separar consentimentos de cookies** (essencial / analytics / ads) com publicidade **off por padrão para menores**.
12. **Direito de arrependimento 7 dias** quando entrar o checkout (Art. 49 CDC).

### 🟡 Alto — primeiros 90 dias pós-lançamento

13. **Relatório de transparência** semestral (preparar modelo mesmo abaixo de 1M menores).
14. Procedimento interno de resposta a **ordem judicial / notificação extrajudicial**.
15. **Depósito de marca** no INPI classe 41 (avaliar o composto "ApexEnem").
16. Revisão de **criativos próprios** à luz do CONAR (nada de gatilho compulsivo para teens).
17. **Acessibilidade WCAG 2.2 AA** — contraste, teclado, alt, labels, focus.
18. **Tokenização de cartão** pelo gateway + webhook de reconciliação.
19. **Página /transparencia** com dados agregados.

### 🟢 Médio — maturidade 6-12 meses

20. Certificação **ISO/IEC 27701** (gestão de privacidade) ou equivalente.
21. **Pentest** externo anual.
22. **Bug bounty** público (Hackerone, YesWeHack ou programa próprio).
23. **Auditoria de IA** — logs de prompts, auditoria de vieses na correção de redação.
24. **Legendas automáticas** nas aulas gravadas quando entrarem.
25. Processo de **data erasure** verificável (comprovante de exclusão).

---

## Fontes principais

- [ECA Digital — Lei 15.211/2025 (OAB Estratégia)](https://oab.estrategia.com/portal/eca-digital-oab/)
- [ECA Digital — IBD TEC](https://www.ibdtec.com.br/post/eca-digital-lei-15211-2025-obrigacoes-prazos)
- [ECA Digital — Juridico.ai](https://juridico.ai/blog/juridico/eca-digital-lei-15-211-2025/)
- [ECA Digital e plataformas — JusBrasil](https://www.jusbrasil.com.br/artigos/eca-digital-e-a-responsabilizacao-de-plataformas-e-marketplaces-analise-da-lei-n-15211-2025/5724886651)
- [LGPD Art. 14 — Confidata](https://confidata.com.br/blog/consentimento-pais-lgpd-escolas-guia)
- [LGPD e Educação — Confidata](https://confidata.com.br/blog/lgpd-educacao-escolas-universidades-edtech)
- [Marco Civil Art. 15 — Modelo Inicial](https://modeloinicial.com.br/lei/L-12965-2014/marco-civil-internet/art-13)
- [CDC Art. 49 — ProJuris](https://www.projuris.com.br/blog/direito-de-arrependimento-2/)
- [Google e Digital ECA](https://support.google.com/legal-help-center/answer/16969297?hl=en)
- [CONAR + Conanda 163/2014 — Migalhas](https://www.migalhas.com.br/depeso/202249/a-recente-resolucao-do-conanda-e-a-publicidade-de-produtos-para-criancas)
- [Idec sobre Conanda 163/2014](https://idec.org.br/em-acao/em-foco/conanda-aprova-resoluco-que-proibe-a-publicidade-direcionada-a-criancas)
- [Instrução Normativa BCB 291/2022 (Pix iniciador)](https://www.lex.com.br/instrucao-normativa-bacen-no-291-de-29-de-julho-de-2022/)

> **Importante:** este relatório é um resumo acionável, não parecer jurídico. Antes de ir ao ar com beta aberto ou monetização, submeter os fluxos de cadastro, consentimento e política de privacidade a um advogado especializado em direito digital / LGPD. Os artigos citados foram colhidos em fontes secundárias — a versão vigente da Lei 15.211/2025 e a regulamentação pela ANPD devem ser confirmadas no Planalto e na página oficial da ANPD.
