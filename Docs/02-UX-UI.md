# Pelo Macio Agenda — UX/UI e Protótipo (Exercício 02)

> Parte do projeto **Pelo Macio Agenda**. Base: [`README.md`](../README.md) (requisitos da Aula 01).
> Protótipo hi-fi navegável: [`prototipo/index.html`](../prototipo/index.html) (abra no navegador; use a largura de celular, 375 px).
> ⚠️ Rascunho gerado com apoio de IA. O teste heurístico abaixo foi feito por **inspeção do código/telas**; precisa ser repetido por humanos (ver seção 6).

---

## 1. Mapa de telas

Profundidade máxima: **2 níveis** (meta ≤ 3).

```
Agenda do dia  (T1, tela inicial)
├── Novo agendamento (T2) ── salva ──► volta à Agenda
└── [aba] Serviços (T3)
        └── Novo / Editar serviço (T4) ── salva ──► volta a Serviços
```

| Tela | Rota (hash) | RFs / USs | Persona principal |
|---|---|---|---|
| **T1 · Agenda do dia** | `#agenda` | RF06, RF07 · US-04, US-05 | Fernanda, Rogério |
| **T2 · Novo agendamento** | `#novo` | RF04, RF05, RF08 · US-02, US-03 | Fernanda |
| **T3 · Serviços** | `#servicos` | RF02 · US-01 | Fernanda |
| **T4 · Novo/Editar serviço** | `#servico-novo`, `#servico-<id>` | RF01, RF03, RF08 · US-01 | Fernanda |

**Fluxo crítico (métrica < 30 s):** Agenda → "+ Novo agendamento" → preenche → Salvar → Agenda. São 2 toques até o formulário.
**Sem dead-ends:** toda tela tem a barra inferior (Agenda / Serviços) e botão Cancelar; `Esc` volta.

---

## 2. Wireframes lo-fi (fluxo, não visual)

```
T1 AGENDA                    T2 NOVO AGENDAMENTO
┌──────────────────┐         ┌──────────────────┐
│ Agenda           │         │ Novo agendamento │
│ sexta, 13 nov.   │         │ [!] Conflito: ...│ ← só se houver
│ [‹] [ data ] [›] │         │ Serviço  [v    ] │
│ ┌──────────────┐ │         │ Data [ ] Hora [ ]│
│ │09:00 Thor…   │ │         │ Termina às 10:00 │
│ │até 10:00 [ok]│ │         │ Tutor  [        ]│
│ │[Cancelar][Não│ │         │ Telefone [      ]│
│ │ veio]        │ │         │ Pet    [        ]│
│ └──────────────┘ │         │ [Cancelar][Salvar]
│       (+ Novo)   │         └──────────────────┘
│[Agenda][Serviços]│
└──────────────────┘
T3 SERVIÇOS                  T4 NOVO/EDITAR SERVIÇO
┌──────────────────┐         ┌──────────────────┐
│ Serviços         │         │ Novo serviço     │
│ ┌──────────────┐ │         │ Nome     [       ]│
│ │Banho  [Editar]│ │         │ Duração  [   min]│
│ │60 min·R$60   │ │         │ Preço    [R$     ]│
│ └──────────────┘ │         │ [Cancelar][Salvar]
│     (+ Novo)     │         │ [Excluir]        │ ← só ao editar
│[Agenda][Serviços]│         └──────────────────┘
└──────────────────┘
```
_(Redesenhe no Excalidraw/papel se o professor exigir imagem; a estrutura acima é a base.)_

---

## 3. Tokens visuais

Paleta no espírito Senac Tech (azul + vermelho + tinta escura), ajustada para contraste AA.

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--c-ink` | `#0F172A` | texto principal | 17,8:1 sobre branco |
| `--c-muted` | `#475569` | texto secundário | 7,6:1 sobre branco |
| `--c-bg` / `--c-surface` | `#F6F7FB` / `#FFFFFF` | fundo / cartões | — |
| `--c-primary` | `#1D4ED8` | ação principal, foco, aba ativa | 6,7:1 com texto branco |
| `--c-danger` | `#B4122F` | erro, cancelar, "não veio" | 6,6:1 sobre branco |
| `--c-ok` | `#0E7C4A` | "agendado" | 5,5:1 sobre branco |
| `--c-warn-bg` / `--c-warn-ink` | `#FFF4D6` / `#6B4200` | aviso de conflito | > 7:1 |

| Categoria | Definição |
|---|---|
| Tipografia | Fonte do sistema (`system-ui`): carrega rápido em 4G (RNF02). Escala: 28 / 20 / 16 / 14 px; pesos 400, 600, 800 |
| Espaçamento | Base 4 px: 4 · 8 · 16 · 24 · 32 |
| Forma | Raio 12 px; área de toque mínima **48 px** |
| Foco | Contorno de 3 px em `--c-primary`, sempre visível |

**Decisão de design:** o elemento que "fala mais alto" é o **horário** (peso 800, 20 px) na agenda; o resto fica discreto. Cor nunca é a única pista: status tem **texto + borda**.

---

## 4. Telas hi-fi

Arquivo único e funcional: [`prototipo/index.html`](../prototipo/index.html). Dados de exemplo ficam **em memória** (recarregar a página reinicia); a persistência real entra na próxima aula (BaaS).

| Tela | Elemento que fala mais alto | O que já funciona |
|---|---|---|
| T1 Agenda | Horário de cada atendimento | Troca de data, ordenação, cancelar (com confirmação), "não veio" (bloqueado em data futura), estado vazio |
| T2 Novo agendamento | Botão "Salvar agendamento" | Validação por campo, **aviso de conflito em tempo real**, cálculo do horário de término, bloqueio de data/hora passada |
| T3 Serviços | Nome do serviço | Lista, editar, estado vazio |
| T4 Serviço | Botão "Salvar serviço" | Validação (≥3 letras, 10–480 min, preço > 0), máscara de R$, exclusão com confirmação e bloqueio se houver agendamentos futuros |

### Prompt CTQ usado (template; trocar `<TELA>`)

```
# CONTEXTO
App web mobile-first (375 px) de agenda para pet shop em Lages/SC. Persona: Fernanda, 38,
dona do pet shop, usa em pé com uma mão. Requisitos: README.md (RF01–RF09, RNF01–RNF06).
Tokens: <colar seção 3>. Sem login, sem bibliotecas externas.

# TAREFA
Gere a tela <TELA> em HTML+CSS+JS puro, com navegação por hash, foco visível, rótulos
em todos os campos e mensagens de erro que dizem como corrigir.

# QUEM
Você é uma designer de produto sênior, especialista em acessibilidade (WCAG AA).

# FORMATO
Um único arquivo HTML. Comente apenas o que não for óbvio.
```

---

## 5. Respostas das perguntas de fechamento

1. **Hierarquia.** T1: o horário. T2: "Salvar agendamento" (e o aviso de conflito quando aparece). T3: o nome do serviço. T4: "Salvar serviço". Cada um é identificável em ~2 s.
2. **Teclado.** Todos os controles são `button`, `a`, `input` ou `select` nativos, alcançáveis por Tab, com foco visível; `Enter` envia formulários e `Esc` volta/desfaz a confirmação. **Pendente:** teste manual completo com leitor de tela.
3. **Validação humana.** Pontos que a IA gerou e **exigem revisão** sua: (a) a regex de telefone (aceita `(49) 99999-9999` e variações; teste casos de borda); (b) a lógica de sobreposição em `conflict()` (testar horário "encostado": fim = início **não** pode conflitar); (c) `toLocaleString("pt-BR")` para moeda; (d) o uso de `innerHTML` (todos os textos digitados passam por `esc()` para evitar injeção de HTML). **O que fazer:** ler cada função, testar os ACs do README na mão e pedir à IA para explicar o que você não entendeu, sem copiar às cegas.

---

## 6. Teste heurístico (5 heurísticas de Nielsen)

Legenda: ✅ atende · ⚠️ atende com ressalva · ❌ falha.  Teste feito por inspeção; **repetir com pessoa real**.

| Heurística | T1 Agenda | T2 Agendar | T3 Serviços | T4 Serviço |
|---|---|---|---|---|
| **1. Visibilidade do estado** | ✅ data no título, status em chip, aviso após ações | ✅ término calculado e conflito em tempo real | ✅ aba ativa marcada | ✅ erros por campo |
| **2. Linguagem do mundo real** | ✅ "Não veio", "Agenda" | ✅ "Pet", "Tutor" | ✅ "min" e "R$" | ✅ rótulos simples |
| **3. Controle e liberdade** | ✅ cancelar em 2 passos, `Esc` desfaz | ✅ Cancelar e `Esc` | ✅ navegação livre | ✅ Cancelar e confirmação ao excluir |
| **4. Consistência** | ✅ mesmos botões e cores | ✅ | ✅ | ✅ "Salvar …" igual nas duas telas |
| **5. Prevenção de erros** | ✅ "Não veio" bloqueado em data futura | ✅ conflito bloqueia salvar; data passada barrada | ✅ | ⚠️ exclusão bloqueada com agendamentos futuros, mas a mensagem some em 2,5 s |

### Problemas encontrados

| # | Tela | Severidade | Problema | Ação |
|---|---|---|---|---|
| 1 | T4 | Média | Mensagem de bloqueio de exclusão é um toast que some | **Corrigir:** mostrar texto fixo sob o botão |
| 2 | T2 | Média | Sem busca/autocompletar de tutor recorrente (viola meta <30 s em retornos) | Backlog (fora do MVP: ver README seção 07) |
| 3 | Todas | Alta (segurança) | Sem login: quem tiver o link vê a agenda | Risco aceito no MVP; tratar antes de uso real |
| 4 | Todas | Baixa | Dados em memória; recarregar apaga | Esperado no protótipo; resolvido com BaaS |
| 5 | T1 | Baixa | Sem visão de horários **livres** (RF06 pede ocupado e livre) | Backlog: grade de horários na próxima iteração |

---

## 7. Autoavaliação

- [x] Distingo UX de UI por perguntas-guia
- [x] Mapeei a jornada com pontos de fricção (seções 1 e 6)
- [x] Mapa de telas com profundidade ≤ 3
- [x] Defini tokens (cores, tipo, espaçamento)
- [x] 4 telas em alta fidelidade prontas
- [x] Teste heurístico aplicado em cada tela _(por inspeção; repetir com humanos)_
- [ ] Teste de teclado e leitor de tela feito na prática
- [ ] Corrigir problema #1 e tratar #5

### Critérios do professor
1. **Coerência visual:** tokens únicos reutilizados nas 4 telas.
2. **Fluxo sem dead-ends:** barra inferior, Cancelar e `Esc` em todas.
3. **Acessibilidade (POUR):** contraste AA, alvos de 48 px, rótulos, foco visível, `aria-live` nos avisos.
4. **Uso crítico da IA:** seção 5 (pergunta 3) lista o que precisa ser revisado.
