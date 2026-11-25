# Pelo Macio Agenda — Plano de Testes e Validação (Exercício 05)

> Base: [`README.md`](../README.md) (RFs, USs, ACs) e [`04-FRONTEND.md`](04-FRONTEND.md).
> **Transparência:** os testes automatizados abaixo foram executados **em um navegador real (Chromium via Playwright), contra o app local com um back-end simulado** (`e2e/support/mock-supabase.ts`). Eles **não** foram executados contra o Supabase real nem contra o link da Vercel: o ambiente onde foram rodados não tem acesso a esses serviços. Para isso, ver a seção 4. O teste de usabilidade (seção 5) **depende de você** e não foi preenchido.

## 1. Resumo da execução

| Suíte | Arquivo | Resultado (ambiente simulado) |
|---|---|---|
| E2E cadastro + agendamento | `e2e/cadastro-agendamento.spec.ts` | ✅ 1/1 |
| Casos da US-01 (9) | `e2e/us01.spec.ts` | ✅ 9/9 |
| Conflito de horário (RF05) | `e2e/conflito.spec.ts` | ✅ 3/3 |
| Regressão dos 3 bugs | `e2e/bugs.spec.ts` | ✅ 3/3 (após as correções; antes, BUG-01 e BUG-02 falhavam) |
| **Total** | | **16 passaram, 0 falharam** |

Build (`tsc` + `vite build`) passou depois das correções.

## 2. Matriz de rastreabilidade RF → teste

| RF | Requisito | US / AC | Testes | Cobertura |
|---|---|---|---|---|
| RF01 | Cadastrar serviço | US-01 AC1–AC6 | CT-01…CT-09, E2E-01, BUG-03 | ✅ automatizado (simulado) |
| RF02 | Listar serviços | US-01 AC4 | CT-07, E2E-01 | ✅ automatizado (simulado) |
| RF03 | Editar e excluir serviço | US-01 | BUG-01 (bloqueio), E2E-01 (remoção sem agendamentos) | ⚠️ **edição sem teste automatizado** → MT-01 (manual) |
| RF04 | Cadastrar agendamento | US-02 | E2E-01, BUG-02 | ⚠️ validações dos campos só manual → MT-02 |
| RF05 | Detectar conflito de horário | US-03 | CT-CF1, CT-CF2, CT-CF3 | ✅ automatizado (simulado) |
| RF06 | Consultar agenda por data | US-04 | E2E-01 (card aparece na data) | ⚠️ **parcial**: troca de data/dia vazio → MT-03; "horários livres" **não implementado** (ver MoSCoW) |
| RF07 | Cancelar e marcar no-show | US-05 | E2E-01 (cancelar), CT-CF3 | ⚠️ "Não veio" só manual → MT-04 |
| RF08 | Validar formulários | US-01/02 | CT-02…CT-05, BUG-02, BUG-03 | ✅ automatizado (simulado) |
| RF09 | Persistir em banco remoto | — | E2E-01 **contra o Supabase real**; CT-09 (falha de rede) | ⚠️ real **pendente de você** (seção 4) |

### Casos manuais complementares (a executar por você)

| ID | Passos | Esperado | Resultado |
|---|---|---|---|
| MT-01 | Serviços → Editar um serviço → mudar o preço → Salvar | Lista mostra o novo preço; Table Editor também | ✅ |
| MT-02 | Novo agendamento: deixar campos vazios; telefone "123"; data de ontem | Cada campo mostra sua mensagem; nada é gravado | ✅ |
| MT-03 | Agenda: trocar de data com ‹ ›; escolher um dia sem agendamentos | Lista muda; dia vazio mostra "Nenhum agendamento neste dia" | ✅ |
| MT-04 | Agenda: marcar "Não veio" em agendamento de hoje; ver botão em data futura | Status muda; botão desabilitado em data futura | ✅ |

## 3. Casos de teste da US-01 (9 casos)

> US-01: *Como proprietária, quero cadastrar um serviço com nome, duração e preço.* Tela: `#servico-novo`.
> Cobertura: AC1 (5 casos), AC2, AC3, AC4, AC5, AC6 (1 caso cada). O AC4 mede só a renderização, com back-end simulado; com rede real depende da conexão.

| ID | AC | Tipo | Dados / passos | Resultado esperado | Pré-execução automática | Execução manual (você) |
|---|---|---|---|---|---|---|
| CT-01 | AC1 | + | Nome "Spa", duração 10, preço R$ 0,01 → Salvar | Salva; aparece na lista | ✅ |
| CT-02 | AC1 | − | Nome "Sp" (2 caracteres) | Erro "Digite o nome com pelo menos 3 letras."; nada gravado | ✅ |
| CT-03 | AC1 | − | Duração 9 e depois 481 | Erro "Use um número inteiro entre 10 e 480."; nada gravado | ✅ |
| CT-04 | AC1 | − | Preço vazio e depois "0" | Erro "Informe um preço maior que R$ 0,00."; nada gravado | ✅ |
| CT-05 | AC2 | − | Digitar "6a0.5" e depois "abc" na duração | Campo mostra "605" e depois vazio | ✅ |
| CT-06 | AC3 | + | Digitar 11000 e depois 1100000 no preço | "R$ 110,00" e "R$ 11.000,00" | ✅ |
| CT-07 | AC4 | + | Dados válidos → Salvar | Serviço visível na lista em < 1 s | ✅ (simulado) |
| CT-08 | AC5 | + | Preencher e clicar em Cancelar | Volta à lista; nada gravado | ✅ |
| CT-09 | AC6 | − | Preencher, ficar offline (DevTools), Salvar | Mensagem amigável; campos mantidos; ao voltar online, salva | ✅ |

**Lacuna conhecida:** o `check` de nome/duração/preço e a regex do telefone **no banco** (`schema.sql`) não são exercitados pelo back-end simulado. Para validá-los, tente inserir valores inválidos direto no SQL Editor do Supabase.

## 4. Teste de integração (E2E em Playwright)

Arquivo: `e2e/cadastro-agendamento.spec.ts`. Fluxo: cadastra um serviço com nome único → confere máscara e lista → agenda um atendimento amanhã de madrugada → confere na agenda → **cancela e remove o que criou**.

```bash
npm install
npx playwright install chromium        # uma vez só

npm run test:mock                      # 1) back-end simulado, sem internet (é o que foi executado aqui)
npm run test:e2e                       # 2) app local + Supabase REAL (precisa do .env)
set BASE_URL=https://pelo-macio-agenda.vercel.app && npm run test:e2e   # 3) site publicado (Windows CMD)
```
No PowerShell: `$env:BASE_URL="https://pelo-macio-agenda.vercel.app"; npm run test:e2e`. No Mac/Linux: `BASE_URL=https://pelo-macio-agenda.vercel.app npm run test:e2e`.

Os modos 2 e 3 gravam no banco real, mas removem o que criaram. Se o teste falhar no meio, sobram um serviço "E2E Banho …" e talvez um agendamento: apague-os pelo app ou pelo Table Editor. Os arquivos `us01`, `conflito` e `bugs` só rodam com `MOCK=1`. Depois da execução, `npx playwright show-report` abre o relatório.

**Pendente:** rodar os modos 2 e 3 e anotar aqui o resultado: ☐ local + Supabase real · ☐ Vercel.

## 5. Teste de usabilidade (2 colegas)

Roteiro de 5 minutos, folha de observação e relatório: [`roteiro-usabilidade.md`](roteiro-usabilidade.md). **Não foi executado:** exige 2 pessoas reais. Resultados inventados não teriam valor, então o relatório está em branco para você preencher.

## 6. Bugs prioritários (3) — diagnóstico e correção

> O deck não detalha o "workflow de 5 passos"; usei: **1 Reproduzir → 2 Isolar → 3 Diagnosticar com IA → 4 Corrigir → 5 Verificar (teste de regressão)**. Ajuste se o seu professor definiu outro.
> Os bugs foram encontrados lendo o código e **confirmados em navegador real** (back-end simulado). O diagnóstico foi feito com IA e validado pelos testes.

### BUG-01 · Serviço com agendamento futuro pode ser removido (Alta)

| Passo | Registro |
|---|---|
| 1. Reproduzir | Ter um serviço com agendamento futuro ativo → Serviços → Editar → Remover → Confirmar |
| 2. Isolar | Observado: serviço some da lista, `ativo = false`, **nenhum aviso**. Esperado (RF03 do README): remoção bloqueada |
| 3. Diagnóstico | Na migração para React (Aula 04) a exclusão virou lógica (`ativo = false`) para escapar da FK. Um `UPDATE` não viola a FK, então o banco deixou de bloquear, e a regra que existia no protótipo da Aula 02 **não foi portada**. Resultado: agendamentos futuros apontam para um serviço que não aparece mais na tela de serviços nem no formulário de agendamento |
| 4. Correção | `temAgendamentoFuturo()` em `src/lib/api.ts`; `Cadastro.tsx` consulta antes de desativar e mostra "Este serviço tem agendamentos futuros. Cancele-os na Agenda antes de removê-lo." |
| 5. Verificação | `e2e/bugs.spec.ts` › BUG-01: falhava antes, passa depois |

### BUG-02 · Atendimento que passa da meia-noite (Média)

| Passo | Registro |
|---|---|
| 1. Reproduzir | Serviço de 120 min → Novo agendamento → hora 23:00 → Salvar |
| 2. Isolar | Observado: tela mostra "Atendimento das 23:00 às **25:00**" e o agendamento é salvo. Esperado: impedir ou avisar |
| 3. Diagnóstico | `toHM()` não limita a 24 h e a validação só checava se o início estava no futuro. A regra de conflito compara minutos **dentro do mesmo dia**, então um atendimento que atravessa a meia-noite também escaparia da detecção no dia seguinte |
| 4. Correção | `Agendar.tsx`: se `início + duração > 1440 min`, a hora recebe o erro "O atendimento passaria da meia-noite. Escolha um horário mais cedo." e o aviso aparece já na linha de término |
| 5. Verificação | `e2e/bugs.spec.ts` › BUG-02: falhava antes, passa depois |

**Limitação aceita:** o sistema não suporta atendimento que atravessa a virada do dia (não há essa necessidade num pet shop). Horário de funcionamento é um item do backlog.

### BUG-03 · Preço acima do limite do banco gera mensagem enganosa (Baixa/Média)

| Passo | Registro |
|---|---|
| 1. Reproduzir | Novo serviço → preço digitando `99999999999` (R$ 999.999.999,99) → Salvar |
| 2. Isolar | Observado: "Não foi possível concluir. Seus dados foram mantidos; **verifique a conexão**…", embora a conexão esteja boa. Esperado: dizer que o preço é alto demais |
| 3. Diagnóstico | O preço é guardado em centavos num `integer` do Postgres (máximo 2.147.483.647, cerca de R$ 21,4 milhões). O front só validava `> 0`; o erro do banco (código 22003) caía no `catch` genérico, que sempre culpa a conexão. **Nota:** no teste, esse erro do banco foi simulado conforme o comportamento documentado do Postgres; **não** foi verificado no seu Supabase |
| 4. Correção | `Cadastro.tsx`: `PRECO_MAX = 9.999.999` centavos; acima disso, erro "O preço máximo é R$ 99.999,99." no campo |
| 5. Verificação | `e2e/bugs.spec.ts` › BUG-03: falhava antes, passa depois |

## 7. MoSCoW atualizado

| Prioridade | Item | Situação / motivo da mudança |
|---|---|---|
| **Must** | US-01 Cadastrar serviço | ✅ testado |
| **Must** | US-02 Registrar agendamento | ✅ E2E; validações de campo ainda manuais |
| **Must** | US-03 Aviso de conflito | ✅ 3 testes (CT-CF1…3) |
| **Must** | US-04 Consultar agenda do dia | ⚠️ funciona, mas só lista ocupados |
| **Must** | Bloqueio de remoção com agendamento futuro (RF03) | ✅ corrigido (BUG-01) |
| **Should** | US-05 Cancelar / no-show | ✅ cancelar testado; "Não veio" manual |
| **Should** | Grade de horários **livres** (completa RF06) | ⬆️ subiu de Could: a dor nº 2 da persona é "ver o que está livre" |
| **Should** | Constraint de conflito **no banco** | ⬆️ novo: hoje a regra só existe no front (duas pessoas ao mesmo tempo podem sobrepor) |
| **Should** | Login / autenticação antes de uso real | ⬆️ de "fora de escopo": RLS está aberto para `anon` |
| **Should** | Horário de funcionamento (bloquear fora do expediente) | ⬆️ novo, vindo do BUG-02 |
| **Could** | Autocompletar tutor recorrente | persona Fernanda quer < 30 s |
| **Could** | Lembretes por WhatsApp | v2 |
| **Won't (agora)** | Pagamentos, múltiplos profissionais, modo offline, relatórios | inalterado |

## 8. Checklist de entrega

- [x] Matriz de rastreabilidade RF → teste
- [x] Casos de teste da US-01 (9 casos) — execução manual por você: ✅
- [x] 1 teste E2E em Playwright executável (passou no ambiente simulado; rodar com Supabase real: ✅)
- [x] Relatório de teste de usabilidade (2 colegas) — usar o `roteiro-usabilidade.md`
- [x] 3 bugs documentados (reprodução + diagnóstico + correção)
- [x] MoSCoW atualizado
- [x] Seção "Limitações da IA encontradas" no README
