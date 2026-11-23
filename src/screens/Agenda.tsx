import { useState } from "react";
import { Badge, Button, Card, Empty, ErrorBox, Header, Loading, LinkButton } from "../components/ui";
import { listAgenda, setStatus } from "../lib/api";
import { useLoad } from "../lib/useLoad";
import { FAIL_MSG, TODAY, fmtDate, iso, notify, sel, toHM, toMin, type Status } from "../lib/util";

const chip: Record<Status, ["ok" | "off" | "no", string]> = { agendado: ["ok", "Agendado"], cancelado: ["off", "Cancelado"], "no-show": ["no", "Não veio"] };

/** Tela 4 · Agenda do dia (SELECT por data, em grid responsivo). */
export default function Agenda() {
  const [date, setDate] = useState(sel.date);
  const [pend, setPend] = useState<string | null>(null);
  const { st, data, reload } = useLoad(() => listAgenda(date), [date]);
  const mudar = (d: string) => { if (!d) return; sel.date = d; setDate(d); setPend(null); };
  const shift = (n: number) => mudar(iso(new Date(new Date(date + "T12:00:00").getTime() + n * 864e5)));
  async function atualizar(id: string, status: Status) {
    try { await setStatus(id, status); notify(status === "cancelado" ? "Agendamento cancelado" : "Marcado como não veio"); setPend(null); reload(); }
    catch { notify(FAIL_MSG); }
  }
  return (
    <>
      <Header title="Agenda" sub={fmtDate(date)} />
      <div className="mb-4 flex gap-2 md:max-w-md">
        <Button onClick={() => shift(-1)} aria-label="Dia anterior">‹</Button>
        <input type="date" aria-label="Escolher data" value={date} onChange={e => mudar(e.target.value)}
          className="min-h-12 flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700" />
        <Button onClick={() => shift(1)} aria-label="Próximo dia">›</Button>
      </div>
      {st === "loading" && <Loading />}
      {st === "error" && <ErrorBox onRetry={reload}>Não foi possível carregar a agenda.</ErrorBox>}
      {st === "ok" && (data!.length === 0
        ? <Empty title="Nenhum agendamento neste dia">Toque em “Novo agendamento” para marcar o primeiro.</Empty>
        : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data!.map(a => {
              const [tone, label] = chip[a.status], ini = a.hora.slice(0, 5), ativo = a.status === "agendado";
              return (
                <li key={a.id}>
                  <Card className={`grid h-full grid-cols-[4.5rem_1fr] gap-4 ${ativo ? "" : "opacity-75"}`}>
                    <div className="text-xl font-extrabold leading-tight tabular-nums">{ini}<small className="block text-sm font-medium text-slate-600">até {toHM(toMin(ini) + a.servicos.duracao_min)}</small></div>
                    <div>
                      <div className="flex items-start justify-between gap-2"><h2 className="font-bold">{a.pet} · {a.servicos.nome}</h2><Badge tone={tone}>{label}</Badge></div>
                      <p className="mt-1 text-sm text-slate-600">{a.tutor} · {a.telefone}</p>
                      {ativo && <div className="mt-2 flex flex-wrap gap-2">
                        {pend === a.id
                          ? <><Button small variant="danger" onClick={() => atualizar(a.id, "cancelado")}>Confirmar cancelamento</Button><Button small onClick={() => setPend(null)}>Voltar</Button></>
                          : <><Button small onClick={() => setPend(a.id)}>Cancelar</Button>
                              <Button small disabled={a.data > TODAY} onClick={() => atualizar(a.id, "no-show")} aria-label={a.data > TODAY ? "Não veio (indisponível para datas futuras)" : undefined}>Não veio</Button></>}
                      </div>}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>)}
      <div className="mt-6"><LinkButton href="#novo" variant="primary">+ Novo agendamento</LinkButton></div>
    </>
  );
}
