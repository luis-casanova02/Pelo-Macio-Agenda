# Pelo Macio Agenda — Documento de Requisitos (MVP)

> **Exercício 01 · Prototipação Rápida de Aplicações com IA**
> Documento gerado com apoio de IA (prompts CTQF) e **revisado por humanos**.
> ⚠️ Entrevista e personas abaixo são **simuladas**: são **hipóteses**, não dados. Confirmação só vem de usuários reais (ver [Checklist de validação](#08--checklist-de-validação-humana)).

| Campo | Valor |
|---|---|
| Projeto | Pelo Macio Agenda |
| Problema equivalente ao caso | Serena Agenda (CRUD de serviços + agendamentos) |
| Equipe | _(preencher: individual / dupla / trio)_ |
| Versão | 0.1 — rascunho validável |
| Status | Hipótese · validar com 5 entrevistas reais |

---

## 01 · CONTEXT

O **Pelo Macio Banho & Tosa**, pet shop de bairro em Lages/SC, agenda banhos e tosas por WhatsApp e caderno. Com 1 proprietária e 2 tosadores, os problemas mais frequentes são: **sobreposição de horários** (um banho de cão grande dura mais que o previsto e atropela o próximo), **no-shows** sem registro e **retrabalho** para reescrever a agenda. A proprietária precisa de um **sistema web simples**, acessível **do celular, sem instalação**, para cadastrar serviços, consultar disponibilidade e registrar agendamentos.

**Restrições do MVP:** mobile-first, sem login, um único estabelecimento, persistência em banco remoto (BaaS: Supabase/Firebase), prazo de construção de dias a poucas semanas, dados pessoais mínimos (LGPD).

**Hipótese a validar:** _se a proprietária consegue registrar um agendamento em menos de 30 s pelo celular e é avisada de conflitos, os conflitos de horário e o retrabalho caem de forma perceptível._

---

## 02 · PERSONA

### 2.1 Entrevista simulada (10 min)

> Prompt CTQF usado: **C**ontexto = pet shop em Lages/SC com agenda em caderno/WhatsApp · **T**arefa = responder a entrevista aberta como persona · **Q**uem = Fernanda, dona do pet shop (não como IA) · **F**ormato = diálogo curto, termina listando dores em ordem.

**Eu:** Fernanda, conte como você agenda hoje.
**Fernanda:** Pelo WhatsApp. A cliente manda mensagem, eu olho o caderno e respondo. Se muda, risco e reescrevo. Já marquei duas pra mesma hora sem perceber.

**Eu:** Me conta a última vez que isso deu problema.
**Fernanda:** Sábado passado. Um golden demorou mais no banho e a tosa das 11h chegou com o cachorro ainda molhado na mesa. A tutora esperou 40 minutos e reclamou.

**Eu:** O que acontece quando alguém não aparece?
**Fernanda:** Fico com o horário vazio e não anoto. Tem tutora que faz isso três vezes e eu nem lembro.

**Eu:** Como você descobre o que está livre durante o dia?
**Fernanda:** Folheio o caderno com a mão molhada. Às vezes peço pro Rogério olhar.

**Eu:** Onde você estaria quando precisasse usar um sistema?
**Fernanda:** Em pé, no balcão ou na sala de banho, só com o celular. Computador não abro, não tenho tempo.

**Eu:** O que te faria desistir de usar?
**Fernanda:** Se precisar de muitos campos ou de senha toda hora. Se eu levar mais de meio minuto, volto pro caderno.

**Eu:** Liste suas dores em ordem.
**Fernanda:**
1. Horários que se sobrepõem.
2. Não saber o que está livre rapidamente.
3. No-show sem histórico.
4. Reescrever a agenda quando muda.
5. Esquecer o valor/duração de cada serviço.

**Insights (hipóteses):** (a) conflito de horário é a dor nº 1; (b) uso exclusivamente em pé e no celular; (c) tolerância baixíssima a formulário longo; (d) duração do serviço é o dado que causa os conflitos.

### 2.2 Três personas (perfis distintos)

---

#### Persona 1/3 — Fernanda Lima ⭐ _primária_
- **Idade / profissão / cidade:** 38 anos · proprietária de pet shop · Lages/SC
- **Perfil:** early adopter moderada — usa WhatsApp Business e Pix, mas nunca usou sistema de agenda.
- **Tech:** Intermediária
- **Empreende há:** 7 anos
- **Dor principal:** horários sobrepostos e falta de visão rápida do que está livre.
- **Cenário de uso:** no balcão, com o celular na mão, registra um agendamento enquanto atende outra cliente, em **<30 s**.
- **Métrica de sucesso:** **zero conflitos de horário por semana**.

---

#### Persona 2/3 — Rogério Almeida
- **Idade / profissão / cidade:** 52 anos · tosador · Lages/SC
- **Perfil:** **relutante** — "o caderno nunca travou".
- **Tech:** Básica
- **Dor principal:** não saber a ordem dos atendimentos do dia sem perguntar à patroa.
- **Cenário de uso:** olha a agenda do dia no celular entre um atendimento e outro; não cria agendamentos, só consulta.
- **Métrica de sucesso:** **consultar a agenda do dia em até 2 toques**, sem digitar nada.

---

#### Persona 3/3 — Camila Ribeiro
- **Idade / profissão / cidade:** 27 anos · analista de marketing, tutora de 2 cães · Lages/SC
- **Perfil:** **exigente/dominante** — quer resposta imediata e confirmação por escrito.
- **Tech:** Avançada
- **Dor principal:** esperar resposta no WhatsApp e não ter certeza do horário combinado.
- **Cenário de uso:** (futuro) quer ver horários livres e reservar sozinha. _No MVP, ela é atendida por Fernanda, que registra o agendamento._
- **Métrica de sucesso:** **horário confirmado em menos de 5 minutos** após o pedido.

---

### 2.3 Tabela comparativa

| Persona | Perfil | Dor principal | Tecnologia | Métrica de sucesso |
|---|---|---|---|---|
| **Fernanda** (primária) | Early adopter | Conflito de horários | Intermediária | 0 conflitos/semana |
| Rogério | Relutante | Ver a ordem do dia | Básica | Agenda em ≤2 toques |
| Camila | Exigente | Demora e incerteza | Avançada | Confirmação <5 min |

**Justificativa da primária:** Fernanda é quem **paga, decide e opera** o sistema; Rogério e Camila influenciam requisitos, mas não são o foco do MVP.

---

## 03 · RF — Requisitos Funcionais

| ID | Requisito | Persona | Prioridade |
|---|---|---|---|
| **RF01** | Cadastrar serviço com nome, duração (min) e preço (R$) | Fernanda | MUST |
| **RF02** | Listar todos os serviços cadastrados | Fernanda | MUST |
| **RF03** | Editar e excluir serviço existente (exclusão bloqueada se houver agendamento futuro) | Fernanda | SHOULD |
| **RF04** | Cadastrar agendamento vinculado a um serviço, com data, hora, nome do tutor, telefone e nome do pet | Fernanda | MUST |
| **RF05** | Detectar e avisar conflito de horário considerando a duração do serviço | Fernanda | MUST |
| **RF06** | Consultar agendamentos por data, exibindo horários ocupados e livres | Fernanda, Rogério | MUST |
| **RF07** | Cancelar agendamento e marcar no-show | Fernanda | SHOULD |
| **RF08** | Validar formulários (campos obrigatórios e formatos) | Todas | MUST |
| **RF09** | Persistir dados em banco remoto | Todas | MUST |

**Testabilidade:** cada RF vira ao menos um teste funcional (ver ACs na seção 05/06).

---

## 04 · RNF — Requisitos Não Funcionais

| ID | Requisito | Métrica / como medir |
|---|---|---|
| **RNF01** | Interface responsiva, **mobile-first** | Funciona sem rolagem horizontal a partir de **320 px** (teste manual em 320, 375 e 414 px) |
| **RNF02** | Desempenho | Carregamento inicial **< 2 s em 4G** (Lighthouse, throttling "Slow 4G"/4G) |
| **RNF03** | Acessibilidade | Contraste **WCAG AA** (≥ 4,5:1) e navegação completa por teclado; **Lighthouse Accessibility ≥ 90** |
| **RNF04** | Segurança de credenciais | **0** chaves secretas no código client; apenas a chave pública (anon) do BaaS; segredos em variáveis de ambiente |
| **RNF05** | Privacidade (LGPD) | Coleta **somente** nome, telefone e nome do pet; sem dados sensíveis; texto de finalidade visível no formulário |
| **RNF06** | Disponibilidade | **≥ 99% em horário comercial** (seg–sáb, 8h–19h), conforme SLA do provedor BaaS escolhido |

---

## 05 · US — Histórias de Usuário

> Formato canônico XP: **Como** `<papel>`, **quero** `<ação>`, **para** `<valor>`.
> Priorização: **MoSCoW** · Qualidade: **INVEST** · Componentes: **Card – Conversation – Confirmation**.

---

### US-01 · Cadastrar novo serviço
- **ID:** US-01
- **Como** proprietária do pet shop (persona: Fernanda),
- **quero** cadastrar um serviço com nome, duração e preço,
- **para** que a agenda saiba quanto tempo cada atendimento ocupa.
- **Prioridade:** MUST · **Estimativa:** 2 pontos · **Depende de:** — · **RFs:** RF01, RF02, RF08, RF09

**Critérios de aceitação**
- **AC1.** Campos obrigatórios: nome (≥ 3 caracteres), duração (10–480 min), preço (> R$ 0,00).
- **AC2.** Duração aceita apenas números inteiros positivos.
- **AC3.** Preço é formatado como `R$ X.XXX,XX` ao digitar.
- **AC4.** Após salvar, o serviço aparece na lista em **< 1 s**.
- **AC5.** Cancelar descarta os dados sem persistência parcial.
- **AC6.** Em erro de rede, exibe mensagem amigável e **mantém** os dados digitados.

---

### US-02 · Registrar agendamento
- **ID:** US-02
- **Como** proprietária (Fernanda),
- **quero** registrar um agendamento escolhendo serviço, data, hora, tutor, telefone e pet,
- **para** substituir o caderno e não perder nenhum atendimento.
- **Prioridade:** MUST · **Estimativa:** 3 pontos · **Depende de:** US-01 · **RFs:** RF04, RF08, RF09

**Critérios de aceitação**
- **AC1.** Campos obrigatórios: serviço, data, hora, nome do tutor (≥ 3 caracteres), telefone (DDD + 8 ou 9 dígitos) e nome do pet.
- **AC2.** Não permite agendar em data/hora **no passado**.
- **AC3.** O fim do atendimento é calculado automaticamente (hora + duração do serviço) e exibido antes de salvar.
- **AC4.** O formulário pode ser preenchido e salvo em **≤ 30 s** em teste cronometrado no celular.
- **AC5.** Após salvar, o agendamento aparece na agenda do dia correspondente.
- **AC6.** Em erro de rede, mantém os dados e permite tentar de novo.

---

### US-03 · Ser avisada de conflito de horário
- **ID:** US-03
- **Como** proprietária (Fernanda),
- **quero** ser avisada quando um novo agendamento sobrepõe outro,
- **para** nunca mais deixar um cliente esperando por atraso do anterior.
- **Prioridade:** MUST · **Estimativa:** 3 pontos · **Depende de:** US-02 · **RFs:** RF05

**Critérios de aceitação**
- **AC1.** Há conflito quando `[início, fim)` do novo agendamento intersecta o de qualquer agendamento ativo.
- **AC2.** Agendamento que começa exatamente quando outro termina **não** é conflito.
- **AC3.** Em conflito, o sistema exibe aviso com o nome do pet e o horário do agendamento que colide.
- **AC4.** Em conflito, o salvamento é **bloqueado** até a usuária alterar o horário.
- **AC5.** Agendamentos **cancelados** não geram conflito.

---

### US-04 · Consultar agenda do dia
- **ID:** US-04
- **Como** proprietária ou tosador (Fernanda/Rogério),
- **quero** ver a agenda de uma data com horários ocupados e livres,
- **para** responder à tutora na hora e saber a ordem dos atendimentos.
- **Prioridade:** MUST · **Estimativa:** 3 pontos · **Depende de:** US-02 · **RFs:** RF06

**Critérios de aceitação**
- **AC1.** A tela abre **por padrão na data de hoje**.
- **AC2.** Cada agendamento mostra horário de início e fim, serviço, pet e tutor, ordenados por hora.
- **AC3.** Trocar de data atualiza a lista em **< 1 s**.
- **AC4.** Dia sem agendamentos exibe a mensagem "Nenhum agendamento neste dia".
- **AC5.** A agenda do dia é acessível em **≤ 2 toques** a partir da tela inicial.

---

### US-05 · Cancelar e registrar no-show
- **ID:** US-05
- **Como** proprietária (Fernanda),
- **quero** cancelar um agendamento ou marcá-lo como "não compareceu",
- **para** liberar o horário e ter histórico de faltas.
- **Prioridade:** SHOULD · **Estimativa:** 2 pontos · **Depende de:** US-02 · **RFs:** RF07

**Critérios de aceitação**
- **AC1.** Cada agendamento tem os estados: `agendado`, `cancelado`, `no-show`.
- **AC2.** Cancelar exige confirmação em uma etapa ("Tem certeza?").
- **AC3.** Agendamento cancelado libera o horário para novos agendamentos.
- **AC4.** Agendamentos `no-show` aparecem destacados na agenda do dia.
- **AC5.** Não é possível marcar `no-show` em agendamento de data futura.

---

### Resumo de priorização (MoSCoW)

| US | Título | MoSCoW | Pontos |
|---|---|---|---|
| US-01 | Cadastrar serviço | **MUST** | 2 |
| US-02 | Registrar agendamento | **MUST** | 3 |
| US-03 | Aviso de conflito | **MUST** | 3 |
| US-04 | Consultar agenda do dia | **MUST** | 3 |
| US-05 | Cancelar / no-show | **SHOULD** | 2 |
| | | **Total** | **13** |

**Verificação INVEST (resumo):** US-01 independente · US-02 depende de US-01 (negociável) · US-03/04/05 dependem de US-02 · todas estimáveis (≤ 3 pontos), pequenas e testáveis.

---

## 06 · AC — Critérios de Aceite (checklist de homologação)

### US-01 · Cadastrar serviço
- [ ] Nome ≥ 3 caracteres, duração 10–480 min e preço > R$ 0 são exigidos
- [ ] Duração rejeita decimais, zero e negativos
- [ ] Preço formata em `R$ X.XXX,XX` ao digitar
- [ ] Serviço aparece na lista em < 1 s após salvar
- [ ] Cancelar não grava nada
- [ ] Erro de rede mostra mensagem amigável e preserva os dados

### US-02 · Registrar agendamento
- [ ] Todos os campos obrigatórios validados (incluindo telefone)
- [ ] Data/hora no passado é rejeitada
- [ ] Horário de término calculado e exibido antes de salvar
- [ ] Cadastro completo em ≤ 30 s no celular
- [ ] Agendamento aparece na agenda do dia
- [ ] Erro de rede preserva os dados

### US-03 · Conflito de horário
- [ ] Sobreposição de intervalos é detectada
- [ ] Horário "encostado" (fim = início) é permitido
- [ ] Aviso mostra pet e horário do agendamento conflitante
- [ ] Salvamento bloqueado enquanto houver conflito
- [ ] Agendamentos cancelados são ignorados

### US-04 · Agenda do dia
- [ ] Abre em "hoje"
- [ ] Itens ordenados por hora, com início, fim, serviço, pet e tutor
- [ ] Troca de data em < 1 s
- [ ] Mensagem para dia vazio
- [ ] Acesso em ≤ 2 toques

### US-05 · Cancelar / no-show
- [ ] Estados `agendado`, `cancelado`, `no-show` funcionam
- [ ] Cancelamento pede confirmação
- [ ] Horário é liberado após cancelar
- [ ] No-show aparece destacado
- [ ] No-show em data futura é bloqueado

### Critérios transversais (RNF)
- [ ] RNF01 — Sem rolagem horizontal em 320 px
- [ ] RNF02 — Carregamento < 2 s em 4G
- [ ] RNF03 — Lighthouse Accessibility ≥ 90 e navegação por teclado
- [ ] RNF04 — Nenhuma chave secreta no client
- [ ] RNF05 — Só nome, telefone e pet coletados, com aviso de finalidade
- [ ] RNF06 — Provedor com SLA ≥ 99% documentado

---

## 07 · OUT — Fora de escopo (NÃO será feito no MVP)

| Item | Motivo | Quando reavaliar |
|---|---|---|
| Login e múltiplos usuários/perfis | Simplicidade; uso por uma única operadora | Após validação com usuários reais |
| Agendamento online pelo próprio cliente (autoatendimento) | Exige autenticação e regras extras | Versão 2 |
| Integração com WhatsApp / envio de lembretes automáticos | Custo e dependência de API externa | Versão 2 |
| Pagamentos (Pix, cartão) e controle financeiro | Fora do problema central | Versão 3 |
| Cadastro completo de tutores e pets (raça, porte, histórico) | MVP guarda apenas nome/telefone/pet | Versão 2 |
| Modo offline com sincronização | Complexidade alta para um MVP | Se a validação mostrar necessidade |
| Relatórios e dashboards | Não resolve a dor nº 1 | Versão 3 |
| Múltiplos profissionais / múltiplas agendas | Hipótese ainda não validada | Após entrevistas reais |
| Migrações, backups automatizados e RLS completo | Característica de produto final | Na evolução MVP → produto |

---

## 08 · Checklist de validação humana

| Eixo | Pergunta | Resultado | Observação |
|---|---|---|---|
| **Cruzamento** | Cada RF tem persona associada? Cada RNF é mensurável? | ✅ | RF→persona na seção 03; RNF com métrica na seção 04 |
| **Viés / invenções** | A IA inventou APIs, bibliotecas ou padrões inexistentes? | ✅ | Nenhuma API citada; apenas BaaS genérico (Supabase/Firebase) a confirmar na documentação oficial |
| **Clareza** | Um dev novo entende em 5 minutos? | ✅ | Contexto em 1 parágrafo, IDs numerados, ACs objetivos |
| **Segurança** | Os RNFs cobrem autenticação, dados sensíveis e LGPD? | ⚠️ | LGPD e credenciais cobertas (RNF04/05). **Autenticação fora do MVP** — risco aceito: qualquer pessoa com o link acessa a agenda. Mitigar antes de uso real |
| **Estereótipos** | Nomes, profissões e gêneros foram revisados? | ✅ | Personas variam em idade, gênero (inclui tosador homem de 52 anos) e familiaridade com tecnologia |
| **Personas = hipótese** | Foram confirmadas com usuários reais? | ❌ pendente | Realizar **3–5 entrevistas reais** (quanto mais, melhor) com donos de pet shop/salões de Lages antes de congelar o escopo |

---

## Próximos passos

1. Realizar 3–5 entrevistas reais e ajustar personas, RFs e ACs.
2. Prototipar telas (mobile-first) a partir das USs MUST.
3. Modelar entidades (`servico`, `agendamento`) e gerar o schema com apoio de IA, **revisando** manualmente.
4. Criar o repositório git e versionar este `README.md`.

---

_Este documento foi produzido com apoio de IA e deve ser tratado como rascunho até a revisão humana e a validação com usuários reais._
# Pelo-Macio-Agenda
