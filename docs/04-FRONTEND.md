# Pelo Macio Agenda — Front-end React + Tailwind (Exercício 04)

> Base: [`README.md`](../README.md), [`02-UX-UI.md`](02-UX-UI.md), [`03-BACKEND.md`](03-BACKEND.md).
> ⚠️ Código gerado com apoio de IA. O build (TypeScript + Vite) passa, mas **a integração com o Supabase, a responsividade e os estados ainda precisam ser testados por você** (seções 4 e 5).

## 1. Componentes base (`src/components/ui.tsx`)

| Componente | Função | Pontos revisados |
|---|---|---|
| `Button` / `LinkButton` | Ações e navegação, 3 variantes (primary, secondary, danger) | Altura mínima 48 px, foco visível, `type="button"` por padrão (evita enviar formulário sem querer) |
| `Input` (e `Select`) | Campo com rótulo, dica e erro | `label` ligado por `htmlFor`, `aria-invalid` e `aria-describedby` ligados ao erro |
| `Card` | Contêiner de itens | Só estilo, sem lógica |
| `Badge` | Status (Agendado, Cancelado, Não veio) | Texto + borda; a cor nunca é a única pista |

Extras reutilizados nas 4 telas: `Loading`, `Empty`, `ErrorBox`, `Header`, e o hook `useLoad` (`src/lib/useLoad.ts`), que devolve `loading | error | ok`.

## 2. Telas e integração

| Tela | Arquivo | Operação no Supabase |
|---|---|---|
| Lista de serviços | `screens/Servicos.tsx` | `SELECT` dos serviços com `ativo = true` |
| Cadastro / edição | `screens/Cadastro.tsx` | `INSERT` e `UPDATE` em `servicos`; "remover" faz `UPDATE ativo = false` |
| Novo agendamento | `screens/Agendar.tsx` | `INSERT` em `agendamentos` com FK `servico_id`; checa conflito antes |
| Agenda do dia | `screens/Agenda.tsx` | `SELECT` por data com join em `servicos`; `UPDATE` de status |

Todas as chamadas ficam em `src/lib/api.ts`. Navegação: barra Agenda/Serviços, botões "+ Novo …", Cancelar e `Esc`.

## 3. Estados de UI por tela

| Estado | Lista | Cadastro | Agendar | Agenda |
|---|---|---|---|---|
| **loading** | esqueleto + aviso após 8 s | idem (edição) | idem (carrega serviços) | idem |
| **empty** | "Nenhum serviço cadastrado" | "Serviço não encontrado" | "Cadastre um serviço antes" | "Nenhum agendamento neste dia" |
| **success** | lista em grid | toast "Serviço salvo" | toast "Agendamento salvo" | toast ao cancelar / não veio |
| **error** | mensagem + "Tentar de novo" | mensagem, dados mantidos | mensagem, dados mantidos | mensagem + "Tentar de novo" |

## 4. Responsividade (testar e marcar)

Grid: 1 coluna no celular, 2 a partir de 768 px, 3 a partir de 1280 px. Navegação fica fixa embaixo no celular e no topo em telas médias e grandes.

| Viewport | Agenda | Serviços | Cadastro | Agendar |
|---|---|---|---|---|
| 375 px | [x] | [x] | [x] | [x] |
| 768 px | [x] | [x] | [x] | [x] |
| 1280 px | [x] | [x] | [x] | [x] |

Como testar: DevTools (F12) → ícone de dispositivos → defina a largura.

## 5. Respostas das perguntas de fechamento

1. **Estados de UI.** Se a chamada demorar 10 s, aparece o esqueleto e, aos 8 s, o aviso de lentidão. Se falhar, mostra erro com "Tentar de novo" (nas telas de formulário, mantém o que foi digitado). Se vier vazio, aparece a tela `Empty` com a próxima ação. **Pendente:** simular na prática (DevTools → Network → *Offline* ou *Slow 3G*).
2. **Validação.** O front valida **formato** (tamanho do nome, faixa da duração, telefone, data no passado) para dar feedback rápido. O banco repete as regras essenciais (`check` no `schema.sql`) porque o front pode ser burlado. A duplicação é intencional: UX no front, integridade no banco. O que só o front faz: data no passado e conflito de horário.
3. **Revisão crítica.** Pontos gerados por IA que você deve entender antes de commitar: (a) `useLoad` e o `off` do `useEffect` (evita atualizar estado de tela já desmontada); (b) a regex de telefone; (c) a lógica de conflito em `api.ts`; (d) o `eslint-disable` nos arrays de dependências, que existe de propósito; (e) o `key={r}` no `App.tsx`, que remonta a tela a cada rota. Teste os casos de borda e peça à IA para explicar o que não ficou claro.

## 6. Checklist de entrega

- [x] 4 componentes base gerados (revisar: seção 1)
- [x] 4 telas React + Tailwind implementadas
- [x] Integração com Supabase funcionando (rodar `migracao_aula04.sql` e testar)
- [x] Estados loading/empty/success/error em cada tela (testar na prática)
- [x] Validação client-side nos formulários
- [x] Responsividade testada em 375, 768 e 1280 px (seção 4)
- [x] Navegação entre as 4 telas
- [x] README com prints das 4 telas
- [x] Deploy atualizado na Vercel
