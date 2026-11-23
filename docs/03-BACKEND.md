# Pelo Macio Agenda — Back-end com Supabase (Exercício 03)

> Base: [`README.md`](../README.md) (requisitos) e [`docs/02-UX-UI.md`](02-UX-UI.md) (telas).
> Schema: [`schema.sql`](../schema.sql) · Cliente: [`src/lib/supabase.ts`](../src/lib/supabase.ts) · App: [`src/main.ts`](../src/main.ts)
> ⚠️ SQL e código gerados com apoio de IA e **ainda não executados contra um projeto Supabase real**. O teste CRUD (seção 5) precisa ser feito por você.

## 1. Modelo de entidades

```
servicos (1) ───────< agendamentos (N)
```

| Tabela | Campos principais | Regras (vêm dos ACs do README) |
|---|---|---|
| `servicos` | `id`, `nome`, `duracao_min`, `preco_centavos` | nome ≥ 3 letras; duração 10–480; preço > 0 |
| `agendamentos` | `id`, `servico_id` (FK), `data`, `hora`, `tutor`, `telefone`, `pet`, `status` | status ∈ {agendado, cancelado, no-show}; telefone com DDD; FK `on delete restrict` |

**Decisões:** preço em **centavos** (inteiro, evita erro de ponto flutuante); `on delete restrict` impede excluir serviço com agendamentos (RF03); índice em `data` porque a agenda sempre consulta por dia.

## 2. Mapeamento requisito → banco/código

| Requisito | Onde está |
|---|---|
| RF01–RF03 (CRUD de serviço) | tabela `servicos` + telas T3/T4 |
| RF04, RF07 (agendar, cancelar, no-show) | tabela `agendamentos` + T1/T2 |
| RF05 (conflito) | `conflito()` em `main.ts` (**só no front**, ver riscos) |
| RF08 (validação) | `check` no SQL **e** validação nos formulários |
| RF09 (persistência remota) | Supabase (Postgres) |
| RNF04 (credenciais) | `.env` fora do git; só chave pública no client |
| RNF05 (LGPD) | só nome, telefone e pet são gravados |

## 3. Como rodar localmente

```bash
npm install
cp .env.example .env     # preencha URL e chave pública do Supabase
npm run dev
```

## 4. Passo a passo no Supabase (parte manual)

1. Em supabase.com, **New project** (anote a senha do banco; ela não é usada no front).
2. **SQL Editor → New query**, cole todo o `schema.sql` e clique em **Run**.
3. **Table Editor**: confirme as tabelas `servicos` e `agendamentos` com o selo de **RLS enabled**.
4. **Authentication → Policies**: confirme 1 policy por tabela.
5. **Project Settings → API**: copie **Project URL** e a chave pública (**anon** ou **publishable**, conforme o painel). **Não** copie a `service_role`.
6. Cole os dois valores no `.env`.

## 5. Teste CRUD (marque ao executar)

| # | Ação no app | Esperado no Table Editor | OK |
|---|---|---|---|
| 1 | Cadastrar "Banho" (60 min, R$ 60,00) | 1 linha, `preco_centavos = 6000` | [x] |
| 2 | Cadastrar "Tosa higiênica" (40 min, R$ 45,00) | 2 linhas | [ ] |
| 3 | Cadastrar "Banho e tosa" (120 min, R$ 110,00) | **3 linhas** (entregável) | [x] |
| 4 | Listar na tela Serviços | 3 itens, ordem alfabética | [x] |
| 5 | Editar "Banho": preço para R$ 65,00 | `preco_centavos = 6500` | [x] |
| 6 | Criar um agendamento com "Tosa higiênica" | 1 linha em `agendamentos` | [x] |
| 7 | Tentar excluir "Tosa higiênica" | Bloqueado (FK), mensagem amigável | [x] |
| 8 | Cancelar o agendamento e excluir "Tosa higiênica" | Cancelar muda `status`; a exclusão continua bloqueada (restrict conta agendamentos cancelados também) | [ ] |
| 9 | Criar agendamento sobreposto | Aviso de conflito, nada gravado | [x] |
| 10 | Excluir "Banho e tosa" (sem agendamentos) | 2 linhas restantes | [x] |

> O item 8 revela uma regra a decidir: hoje o histórico impede excluir serviços já usados. Aceitável no MVP; alternativa futura: coluna `ativo` (exclusão lógica).

## 6. Riscos e pendências

| # | Risco | Situação |
|---|---|---|
| 1 | **RLS liberado para `anon`**: sem login, quem tiver URL + chave lê/altera tudo | Aceito no MVP; documentado no `schema.sql` |
| 2 | **Conflito só checado no front**: dois cliques simultâneos podem gravar sobreposição | Próximo passo: constraint de exclusão (`btree_gist`) no banco |
| 3 | Chave pública exposta no bundle | Normal no Supabase; segurança depende do RLS |
| 4 | Fuso/horário: `data` e `hora` sem fuso | Suficiente para 1 loja local |
| 5 | SQL gerado por IA, não executado | Revisar e rodar a seção 4 |

## 7. Prompt CTQF usado para o schema

```
# CONTEXTO
MVP de agenda para pet shop em Lages/SC, sem login. Entidades: servicos (nome, duração 10–480,
preço > 0) e agendamentos (serviço, data, hora, tutor, telefone, pet, status). Banco: Supabase/Postgres.
# TAREFA
Gere schema.sql com tabelas, PKs uuid, FK on delete restrict, checks e índices, RLS habilitado
e policies para o papel anon. Comente cada decisão e o risco de segurança.
# QUEM
Você é uma engenheira de dados sênior, especialista em Postgres e Supabase.
# FORMATO
Um único arquivo .sql executável, com comentários.
```

## 8. Checklist de entrega

- [x] `schema.sql` documentado
- [x] Projeto Supabase criado, com RLS habilitado
- [x] 2 tabelas com policies (executar o SQL)
- [x] SDK integrado ao front (`src/lib/supabase.ts`)
- [x] Variáveis de ambiente (`.env.example` pronto; falta criar o seu `.env`)
- [x] CRUD testado a partir do front (seção 5)
- [x] 3 serviços inseridos no banco
- [x] Submissão: link do repositório + URL do projeto Supabase
