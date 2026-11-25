import { supabase } from "./supabase";
import { toMin, type Agendamento, type Servico, type Status } from "./util";

type Row = { nome: string; duracao_min: number; preco_centavos: number };
const JOIN = "*, servicos(nome, duracao_min)";

export async function listServicos(): Promise<Servico[]> {
  const { data, error } = await supabase.from("servicos").select("*").eq("ativo", true).order("nome");
  if (error) throw error;
  return data as Servico[];
}
export async function saveServico(id: string | null, row: Row) {
  const { error } = id ? await supabase.from("servicos").update(row).eq("id", id) : await supabase.from("servicos").insert(row);
  if (error) throw error;
}
/** Exclusão lógica: preserva o histórico de agendamentos que usam o serviço. */
export async function desativarServico(id: string) {
  const { error } = await supabase.from("servicos").update({ ativo: false }).eq("id", id);
  if (error) throw error;
}
export async function listAgenda(data: string): Promise<Agendamento[]> {
  const r = await supabase.from("agendamentos").select(JOIN).eq("data", data).order("hora");
  if (r.error) throw r.error;
  return r.data as unknown as Agendamento[];
}
/** US-03: conflito se [início, fim) intersecta outro agendamento ativo do dia. */
export async function conflito(data: string, hora: string, dur: number): Promise<Agendamento | null> {
  const r = await supabase.from("agendamentos").select(JOIN).eq("data", data).eq("status", "agendado");
  if (r.error) throw r.error;
  const a = toMin(hora), b = a + dur;
  return (r.data as unknown as Agendamento[]).find(x => a < toMin(x.hora) + x.servicos.duracao_min && toMin(x.hora) < b) ?? null;
}
export async function criarAgendamento(row: { servico_id: string; data: string; hora: string; tutor: string; telefone: string; pet: string }) {
  const { error } = await supabase.from("agendamentos").insert(row);
  if (error) throw error;
}
export async function setStatus(id: string, status: Status) {
  const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
  if (error) throw error;
}
/** RF03: serviço com agendamento futuro ativo não pode ser removido. */
export async function temAgendamentoFuturo(servicoId: string, hoje: string): Promise<boolean> {
  const { data, error } = await supabase.from("agendamentos").select("id")
    .eq("servico_id", servicoId).eq("status", "agendado").gte("data", hoje).limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
