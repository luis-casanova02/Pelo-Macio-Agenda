import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button, Empty, ErrorBox, Header, Input, LinkButton, Loading, Select } from "../components/ui";
import { conflito, criarAgendamento, listServicos } from "../lib/api";
import { useLoad } from "../lib/useLoad";
import { TODAY, brl, go, notify, sel, toHM, toMin, type Agendamento, type Servico } from "../lib/util";

/** Tela 3 · Novo agendamento (INSERT com chave estrangeira servico_id). */
export default function Agendar() {
  const { st, data, reload } = useLoad(listServicos, []);
  return (
    <>
      <Header title="Novo agendamento" sub="Preencha os dados do atendimento" />
      {st === "loading" && <Loading />}
      {st === "error" && <ErrorBox onRetry={reload}>Não foi possível carregar os serviços.</ErrorBox>}
      {st === "ok" && (data!.length === 0
        ? <Empty title="Cadastre um serviço antes">Os agendamentos usam a duração do serviço para evitar conflitos.<br /><LinkButton href="#servico-novo" variant="primary" className="mt-3">Cadastrar serviço</LinkButton></Empty>
        : <Form servs={data!} />)}
    </>
  );
}

function Form({ servs }: { servs: Servico[] }) {
  const [svc, setSvc] = useState(servs[0].id);
  const [data, setData] = useState(sel.date < TODAY ? TODAY : sel.date);
  const [hora, setHora] = useState("");
  const [tutor, setTutor] = useState("");
  const [tel, setTel] = useState("");
  const [pet, setPet] = useState("");
  const [er, setEr] = useState<Record<string, string>>({});
  const [conf, setConf] = useState<Agendamento | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);
  const s = servs.find(x => x.id === svc)!;

  useEffect(() => { // aviso de conflito em tempo real
    if (!hora || !data) { setConf(null); return; }
    let off = false;
    conflito(data, hora, s.duracao_min).then(c => { if (!off) setConf(c); }).catch(() => { /* tratado ao salvar */ });
    return () => { off = true; };
  }, [svc, data, hora]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: FormEvent) {
    e.preventDefault();
    const now = new Date(), x: Record<string, string> = {};
    if (!data) x.data = "Informe a data."; else if (data < TODAY) x.data = "A data não pode estar no passado.";
    if (!hora) x.hora = "Informe a hora."; else if (data === TODAY && toMin(hora) < now.getHours() * 60 + now.getMinutes()) x.hora = "Esse horário já passou.";
    else if (toMin(hora) + s.duracao_min > 1440) x.hora = "O atendimento passaria da meia-noite. Escolha um horário mais cedo.";
    if (tutor.trim().length < 3) x.tutor = "Digite o nome com pelo menos 3 letras.";
    if (!/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(tel.trim())) x.tel = "Digite o telefone com DDD, ex.: (49) 99999-9999.";
    if (!pet.trim()) x.pet = "Informe o nome do pet.";
    setEr(x); setFail(false);
    const first = Object.keys(x)[0];
    if (first) { document.getElementById("f-" + first)?.focus(); return; }
    setBusy(true);
    try {
      const c = await conflito(data, hora, s.duracao_min);
      if (c) { setConf(c); setBusy(false); return; }
      await criarAgendamento({ servico_id: svc, data, hora, tutor: tutor.trim(), telefone: tel.trim(), pet: pet.trim() });
      sel.date = data; notify("Agendamento salvo"); go("#agenda");
    } catch { setFail(true); setBusy(false); } // os dados digitados são mantidos
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 md:max-w-xl">
      {conf && <div role="alert" className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 font-semibold text-amber-900">
        Conflito: {conf.pet} já está marcado das {conf.hora.slice(0, 5)} às {toHM(toMin(conf.hora) + conf.servicos.duracao_min)}. Escolha outro horário.</div>}
      <Select id="f-svc" label="Serviço" value={svc} onChange={e => setSvc(e.target.value)}>
        {servs.map(o => <option key={o.id} value={o.id}>{o.nome} · {o.duracao_min} min · {brl(o.preco_centavos)}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input id="f-data" label="Data" type="date" value={data} onChange={e => setData(e.target.value)} error={er.data} />
        <Input id="f-hora" label="Hora" type="time" value={hora} onChange={e => setHora(e.target.value)} error={er.hora} />
      </div>
      <p aria-live="polite" className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2 text-slate-600">
        {!hora ? "Escolha a hora para ver o término." : toMin(hora) + s.duracao_min > 1440
          ? <span className="font-semibold text-red-700">Esse atendimento passaria da meia-noite.</span>
          : <>Atendimento das <b className="text-slate-900">{hora}</b> às <b className="text-slate-900">{toHM(toMin(hora) + s.duracao_min)}</b></>}
      </p>
      <Input id="f-tutor" label="Nome do tutor" autoComplete="name" value={tutor} onChange={e => setTutor(e.target.value)} error={er.tutor} />
      <Input id="f-tel" label="Telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(49) 99999-9999" value={tel} onChange={e => setTel(e.target.value)} error={er.tel} />
      <Input id="f-pet" label="Nome do pet" value={pet} onChange={e => setPet(e.target.value)} error={er.pet} />
      <p className="text-sm text-slate-600">Guardamos só nome, telefone e nome do pet, para organizar a agenda (LGPD).</p>
      {fail && <ErrorBox>Não foi possível concluir. Seus dados foram mantidos; verifique a conexão e tente de novo.</ErrorBox>}
      <div className="flex gap-2">
        <LinkButton href="#agenda" className="flex-1">Cancelar</LinkButton>
        <Button type="submit" variant="primary" disabled={busy} className="flex-1">{busy ? "Salvando…" : "Salvar agendamento"}</Button>
      </div>
    </form>
  );
}
