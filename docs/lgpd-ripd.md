# RIPD — Relatório de Impacto à Proteção de Dados

**Projeto:** ApexEnem — plataforma educacional adaptativa para o ENEM.
**Base:** LGPD Art. 38 + Res. CD/ANPD 4/2023 (quando aplicável a agentes de pequeno porte).
**Autor:** Fernando Anderson Sousa, na condição de controlador.
**Última revisão:** 2026-11-14.
**Versão:** 1.0.

Este RIPD foca em **tratamento de dados de crianças e adolescentes** (LGPD
Art. 14 + Lei 15.211/2025 — Estatuto Digital), que é o tratamento de maior
risco do projeto. Os demais tratamentos estão descritos em
[lgpd-mapa-dados.md](./lgpd-mapa-dados.md).

---

## 1. Descrição do tratamento

**Finalidade.** Permitir que estudantes a partir de 13 anos preparem-se
para o ENEM na plataforma, com correção de redação por IA, simulados,
aulas personalizadas e acompanhamento da evolução.

**Natureza.** Processamento automatizado, nuvem (Supabase + Vercel + Render).

**Categorias de titulares.**
- Crianças (12 anos ou menos): **cadastro bloqueado** no formulário.
- Adolescentes (13 a 17 anos): cadastro permitido mediante informação de
  e-mail do responsável legal e consentimento parental no ato.
- Maiores de idade (18+): cadastro padrão.

**Categorias de dados.** Ver [lgpd-mapa-dados.md §1](./lgpd-mapa-dados.md#1-categorias-de-dados-tratados).

**Volume estimado.** < 1.000 titulares em beta (novembro/2026).

---

## 2. Necessidade e proporcionalidade (LGPD Arts. 6º e 14)

- **Minimização.** Coletamos apenas: nome, e-mail, data de nascimento
  (para age gate e LGPD Art. 14), localização declarada (estado/cidade),
  e-mail do responsável (para menores). Não pedimos CPF, endereço
  residencial, telefone, documento de identidade, nem foto obrigatória.
- **Finalidade específica.** Cada campo tem uso documentado no mapa de
  dados e na Política de Privacidade pública.
- **Base legal.** Execução de contrato (Art. 7º, V) para o serviço em si;
  consentimento específico e destacado do responsável (Art. 14, §1º) para
  menores; obrigação legal (Art. 7º, II) para registro de consentimento e
  denúncias.

---

## 3. Riscos identificados e mitigações

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Menor se cadastrar fingindo ter 18+ | Média | Médio | Age gate na UI; auditoria do `birthdate`; termos informam que falsidade é motivo de encerramento. Risco residual: aceitável. |
| R2 | Consentimento parental não verificado | Média | Alto | E-mail de aviso ao responsável imediatamente após o cadastro, com link para criar o Painel do Responsável. Enquanto o responsável não ativar, ele recebe o aviso. Melhoria futura: exigir clique num link assinado antes de liberar funções de IA. |
| R3 | Dado de redação sendo usado para treinar modelo externo | Baixa | Alto | Contratos com OpenRouter e Google (Gemini API) obrigam a não treinar com dados pagos; não enviamos dados identificáveis junto com o prompt (apenas o texto da redação). Confirmar nos DPAs vigentes. |
| R4 | Vazamento de credencial (service role, HMAC) | Baixa | Alto | Secrets exclusivamente em env vars da Vercel; nenhum valor commitado; runbook de incidente prevê rotação imediata. Rate limit + 2FA opcional. |
| R5 | Acesso cruzado entre usuários (A vê dados de B) | Baixa | Alto | RLS em todas as tabelas; policies auditadas em `migrations/2026-10-26-rls-hardening.sql`; testes de isolamento em `tests/isolation.test.ts`. |
| R6 | IA devolver conteúdo nocivo a menor | Baixa | Médio | Prompt de triagem (`aiTriage`) bloqueia jailbreak e conteúdo vazio; correção segue cartilha do ENEM; AdSense configurado com `TFUA=1` (sem anúncios comportamentais para menores). |
| R7 | Conteúdo denunciado por terceiros (Lei Felca Art. 8º) | Média | Médio | Endpoint `/api/denuncia` + página `/denunciar` + canal público; registro em `denuncias` com SLA de 48h para análise. |
| R8 | Falha de controle parental (responsável não recebe) | Média | Médio | E-mail via Resend com DKIM/SPF; link alternativo no painel do aluno; DPO acessível. |
| R9 | Retenção excessiva | Baixa | Médio | Cron `/api/retention` apaga automaticamente `ai_tasks > 90d` e `activity_logs > 365d`; aluno pode deletar conta e redações. |

---

## 4. Direitos do titular — ajustes para menores

- **Ação do próprio menor.** Mesmo adolescente pode baixar e apagar seus
  dados pela Configurações, sem necessidade de pedir ao responsável.
- **Ação do responsável.** O responsável cria conta em
  `/controleparental/[student_id]` com o e-mail cadastrado como
  `parent_email` e tem leitura do dashboard do menor (metas, pontos fracos,
  atividade). O responsável **não** exclui a conta do menor pela UI —
  precisa escrever para o DPO; isso evita que um terceiro mal-intencionado
  com acesso ao e-mail do responsável destrua os dados do menor.
- **Canal.** `dpo@apexenem.com.br` para solicitações qualificadas.

---

## 5. Decisão

A proporcionalidade do tratamento é favorável: os benefícios educacionais
(acesso gratuito a correção e simulado de qualidade para adolescentes de
baixa renda) superam os riscos residuais, dado que as mitigações estão
implementadas e verificáveis em código e migrations.

**Pendências de melhoria contínua** (não bloqueiam o funcionamento):

- Exigir clique em link assinado do responsável antes de liberar IA para
  o menor (eleva R2 de aceitável para baixo).
- Rodar auditoria externa anual quando o volume ultrapassar 10.000 menores.
- Reavaliar a necessidade do campo `birthdate` à luz do princípio da
  minimização — considerar guardar apenas `is_minor` e o ano.

**Próxima revisão:** 2027-05-14 (semestral) ou mediante incidente
relevante, mudança de operador ou mudança de regulamentação.
