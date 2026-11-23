export type Servico = { id: string; nome: string; duracao_min: number; preco_centavos: number };
export type Status = "agendado" | "cancelado" | "no-show";
export type Agendamento = {
  id: string; servico_id: string; data: string; hora: string;
  tutor: string; telefone: string; pet: string; status: Status;
  servicos: { nome: string; duracao_min: number };
};

export const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const TODAY = iso(new Date());
export const sel = { date: TODAY }; // data escolhida na Agenda, lembrada ao voltar do cadastro
export const toMin = (h: string) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
export const toHM = (m: number) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
export const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
export const notify = (msg: string) => window.dispatchEvent(new CustomEvent("toast", { detail: msg }));
export const go = (hash: string) => { location.hash = hash; };
export const FAIL_MSG = "Não foi possível concluir. Verifique a conexão e tente de novo.";
