# Mapa de Dados Pessoais — ApexEnem (ROPA)

**Base:** LGPD (Lei 13.709/2018), Art. 37 — Registro de Operações.
**Controlador:** Fernando Anderson Sousa (pessoa física).
**Encarregado (DPO):** dpo@apexenem.com.br.
**Última revisão:** 2026-11-14.
**Versão:** 1.0.

Este documento é o inventário canônico. Em caso de divergência com código ou
política pública, prevalece a legislação; a divergência deve ser corrigida.

---

## 1. Categorias de dados tratados

| Categoria | Campos | Finalidade | Base legal | Retenção | Local | Operador |
|---|---|---|---|---|---|---|
| **Identificação** | nome, e-mail, data de nascimento | criar conta, personalizar, atender LGPD menores | execução de contrato (Art. 7º, V) | enquanto conta ativa + 1 ano | Supabase `auth.users` + `profiles` | Supabase Inc. |
| **Localização declarada** | região, estado, cidade | ranking regional e sugestões de curso | execução de contrato | idem | Supabase `profiles` | Supabase |
| **Preferências** | metas de curso, assuntos fracos, streak | montar plano de estudos adaptativo | execução de contrato | idem | Supabase `profiles` | Supabase |
| **Produção acadêmica** | redações, respostas de questões, simulados | corrigir, pontuar, acompanhar evolução | execução de contrato | idem; aluno pode apagar antes | Supabase `essay_corrections`, `simulado_history`, `question_responses` | Supabase |
| **Eventos de uso** | logs de atividade, XP, moedas | gamificação e analytics interno | legítimo interesse (Art. 7º, IX) | **365 dias** (cron `/api/retention`) | Supabase `activity_logs`, `wallets` | Supabase |
| **Jobs de IA** | prompts enviados à IA, resultado, timestamps | processar correção/aula/questão | execução de contrato | **90 dias** (cron `/api/retention`) | Supabase `ai_tasks` + Render | Supabase, Render, OpenRouter, Google |
| **Consentimento** | aceite termos, versão, data; marketing opt-in, data; consentimento parental | comprovar LGPD Arts. 8º, 14, §4º | obrigação legal (Art. 7º, II) | enquanto conta ativa + 5 anos | Supabase `profiles` | Supabase |
| **Autenticação forte** | fator TOTP (seed MFA), fatores verificados | 2FA opcional | segurança (Art. 7º, IX) | enquanto 2FA ativo | Supabase Auth | Supabase |
| **Avatar** | arquivo de imagem do usuário | identificação visual na UI | execução de contrato | enquanto conta ativa | Supabase Storage bucket `avatars` | Supabase |
| **Denúncias** | descrição, categoria, URL reportada, status | cumprimento Lei Felca / ECA Digital | obrigação legal | 2 anos | Supabase `denuncias` | Supabase |
| **Dados de menor** | e-mail do responsável, consentimento parental, data | LGPD Art. 14 + Lei 15.211/2025 | consentimento + obrigação legal | enquanto conta ativa do menor | Supabase `profiles` | Supabase |

### Dados que **não** coletamos

- CPF, RG, passaporte, dados bancários
- Localização precisa (GPS)
- Dados biométricos
- Dados de saúde
- Histórico de navegação fora da plataforma
- Contatos do dispositivo

---

## 2. Operadores e sub-operadores

| Fornecedor | Função | Dados compartilhados | País de hospedagem | DPA / Termos |
|---|---|---|---|---|
| **Supabase Inc.** | banco, auth, storage | todos os dados listados acima | EUA + regiões da escolha do projeto | [Supabase DPA](https://supabase.com/legal/dpa) |
| **Vercel Inc.** | hospedagem do site e das funções serverless | logs de requisição, IP, user-agent | multirregião (gru1 ativa) | [Vercel DPA](https://vercel.com/legal/dpa) |
| **Render.com** | worker Node para jobs longos de IA | prompts, resultados, user_id | EUA | [Render DPA](https://render.com/legal/dpa) |
| **OpenRouter.ai** | proxy multi-modelo de LLMs | prompts, texto de redação | EUA | [OpenRouter Privacy](https://openrouter.ai/privacy) |
| **Google (Gemini API via @google/genai)** | modelo de IA | prompts, texto de redação | multirregião | [Google AI Terms](https://ai.google.dev/terms) |
| **Resend** | envio de e-mail transacional | e-mail, nome, conteúdo do template | EUA (Delaware) | [Resend DPA](https://resend.com/legal/dpa) |
| **Upstash** | rate limit distribuído (opcional) | identificador hash do request | multirregião | [Upstash Privacy](https://upstash.com/privacy) |
| **Google AdSense** | anúncios após consentimento | identificadores anonimizados | multirregião | [AdSense Terms](https://support.google.com/adsense) |
| **hCaptcha** | proteção anti-bot nos formulários | IP + fingerprint do navegador | EUA | [hCaptcha Privacy](https://www.hcaptcha.com/privacy) |

**Transferência internacional:** todos os operadores acima tratam dados fora
do Brasil. Mitigação: cláusulas-padrão nos DPAs listados; nada de dado
sensível (Art. 11 LGPD) é tratado.

---

## 3. Direitos do titular — como atendemos (LGPD Art. 18)

| Direito | Como o titular exerce | Endpoint / fluxo |
|---|---|---|
| Confirmação e acesso | botão **Baixar meus dados** em Configurações | `GET /api/user-data-export` |
| Correção | tela "Perfil" permite editar nome, localização, metas | update em `profiles` com whitelist |
| Anonimização / eliminação | botão **Excluir conta permanentemente** em Configurações | `POST /api/delete-account` (apaga de todas as tabelas + `auth.users`) |
| Portabilidade | mesmo botão de export; JSON estruturado | `GET /api/user-data-export` |
| Informação sobre uso compartilhado | este documento + Política de Privacidade | público |
| Revogação do consentimento | marketing: link de descadastro em todo e-mail; termos: exige excluir a conta | — |
| Revisão de decisão automatizada | correção por IA é apoio; aluno pode pedir revisão por e-mail | `contato@apexenem.com.br` |

**Tempo de resposta alvo:** 15 dias corridos (ANPD recomenda 15; LGPD não
fixa prazo específico para o titular, só para ANPD/comunicação de incidente).

---

## 4. Retenção automática

Implementada pelo cron diário `GET /api/retention` (vercel.json, 04:00 UTC):

- `ai_tasks` com `created_at < NOW() - 90 dias` → DELETE
- `activity_logs` com `created_at < NOW() - 365 dias` → DELETE

Backups do Supabase seguem a política do plano contratado; o aluno é
informado na Política de Privacidade de que a exclusão sob demanda é imediata
no banco ativo, mas pode permanecer até 30 dias em snapshots de backup.

---

## 5. Plano de resposta a vazamento (LGPD Arts. 46–48)

1. **Detecção.** Alertas de erro 5xx e tentativas anômalas (ver `docs/runbook-incident.md`).
2. **Contenção.** Revogar credencial exposta no painel Supabase/Vercel/Resend; pausar o endpoint vulnerável via feature flag ou revert.
3. **Classificação.** Quais titulares, quais categorias, janela de exposição.
4. **Comunicação à ANPD.** Quando houver risco relevante: formulário oficial ANPD em até 3 dias úteis a contar da ciência. Agente de pequeno porte: prazo dobrado conforme Res. CD/ANPD 2/2022 — **confirmar vigência** no momento do incidente.
5. **Comunicação aos titulares.** E-mail transacional via Resend com: o que aconteceu, quais dados, quando, medidas tomadas, como o titular pode se proteger, canal DPO para dúvidas.
6. **Registro.** Linha em `docs/incidentes/YYYY-MM-DD-slug.md` com causa raiz, decisão, prevenção.

---

## 6. Revisão deste documento

**Periodicidade:** trimestral ou a cada mudança de fornecedor, fluxo de dado
ou base legal. Responsável: DPO.
