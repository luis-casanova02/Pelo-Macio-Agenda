-- Rode UMA vez no SQL Editor do Supabase (para quem já executou o schema.sql da Aula 03).
-- Adiciona a coluna "ativo": a lista de serviços passa a mostrar só os ativos e
-- "remover" vira exclusão lógica, preservando o histórico de agendamentos.
alter table public.servicos add column if not exists ativo boolean not null default true;
