-- =====================================================================
-- Pelo Macio Agenda · schema.sql  (cole no Supabase > SQL Editor > Run)
-- 2 tabelas: servicos (1) ──< agendamentos (N)
-- =====================================================================

-- ---------- Tabelas ----------
create table public.servicos (
  id              uuid primary key default gen_random_uuid(),
  nome            text        not null check (char_length(trim(nome)) >= 3),            -- US-01 AC1
  duracao_min     integer     not null check (duracao_min between 10 and 480),          -- US-01 AC1/AC2
  preco_centavos  integer     not null check (preco_centavos > 0),                      -- dinheiro em centavos (sem float)
  criado_em       timestamptz not null default now()
);

create table public.agendamentos (
  id          uuid primary key default gen_random_uuid(),
  servico_id  uuid not null references public.servicos(id) on delete restrict,          -- não apaga serviço em uso (RF03)
  data        date not null,
  hora        time not null,
  tutor       text not null check (char_length(trim(tutor)) >= 3),                      -- US-02 AC1
  telefone    text not null check (telefone ~ '^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$'),        -- DDD + 8 ou 9 dígitos
  pet         text not null check (char_length(trim(pet)) >= 1),
  status      text not null default 'agendado'
              check (status in ('agendado', 'cancelado', 'no-show')),                   -- US-05 AC1
  criado_em   timestamptz not null default now()
);

create index agendamentos_data_idx on public.agendamentos (data);
create index agendamentos_servico_idx on public.agendamentos (servico_id);

-- ---------- RLS (Row Level Security) ----------
alter table public.servicos     enable row level security;
alter table public.agendamentos enable row level security;

-- ⚠️ RISCO ACEITO NO MVP: não há login, então as policies liberam o papel "anon".
-- Na prática, quem tiver a URL + chave pública pode ler e alterar os dados.
-- Ao introduzir autenticação, troque "to anon" por "to authenticated" e filtre por dono (auth.uid()).
create policy "servicos: anon pode tudo"
  on public.servicos for all to anon using (true) with check (true);

create policy "agendamentos: anon pode tudo"
  on public.agendamentos for all to anon using (true) with check (true);

-- ---------- Permissões da Data API ----------
-- Necessário quando "Grant API access to new tables automatically" está DESMARCADO no projeto.
-- Sem estes GRANTs, a API responde "permission denied" mesmo com a policy criada.
-- Se a opção estiver marcada, os comandos são redundantes e inofensivos.
grant usage on schema public to anon;
grant select, insert, update, delete on public.servicos, public.agendamentos to anon;
