import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Empty, ErrorBox, Header, Input, LinkButton, Loading } from "../components/ui";
import { desativarServico, listServicos, saveServico } from "../lib/api";
import { useLoad } from "../lib/useLoad";
import { brl, go, notify, type Servico } from "../lib/util";

/** Tela 2 · Cadastro/edição de serviço (INSERT/UPDATE). id = "novo" ou o uuid do serviço. */
export default function Cadastro({ id }: { id: string }) {
  const novo = id === "novo";
  const { st, data, reload } = useLoad(listServicos, []);
  const title = novo ? "Novo serviço" : "Editar serviço";
  if (!novo && st === "loading") return <><Header title={title} /><Loading /></>;
  if (!novo && st === "error") return <><Header title={title} /><ErrorBox onRetry={reload}>Não foi possível carregar o serviço.</ErrorBox></>;
  const atual = novo ? undefined : data?.find(s => s.id === id);
  if (!novo && !atual) return <><Header title={title} /><Empty title="Serviço não encontrado"><LinkButton href="#servicos" className="mt-3">Voltar</LinkButton></Empty></>;
  return <Form key={id} id={id} atual={atual} title={title} />;
}

function Form({ id, atual, title }: { id: string; atual?: Servico; title: string }) {
  const novo = id === "novo";
  const [nome, setNome] = useState(atual?.nome ?? "");
  const [dur, setDur] = useState(atual ? String(atual.duracao_min) : "");
  const [preco, setPreco] = useState(atual ? brl(atual.preco_centavos) : "");
  const [er, setEr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);
  const [ask, setAsk] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const d = parseInt(dur, 10), p = parseInt(preco.replace(/\D/g, "") || "0", 10), x: Record<string, string> = {};
    if (nome.trim().length < 3) x.nome = "Digite o nome com pelo menos 3 letras.";
    if (!(d >= 10 && d <= 480)) x.dur = "Use um número inteiro entre 10 e 480.";
    if (!(p > 0)) x.preco = "Informe um preço maior que R$ 0,00.";
    setEr(x); setFail(false);
    const first = Object.keys(x)[0];
    if (first) { document.getElementById("f-" + first)?.focus(); return; }
    setBusy(true);
    try { await saveServico(novo ? null : id, { nome: nome.trim(), duracao_min: d, preco_centavos: p }); notify("Serviço salvo"); go("#servicos"); }
    catch { setFail(true); setBusy(false); } // os dados digitados são mantidos
  }
  async function remover() {
    if (!ask) { setAsk(true); return; }
    try { await desativarServico(id); notify("Serviço removido da lista"); go("#servicos"); } catch { setFail(true); }
  }

  return (
    <>
      <Header title={title} sub="Informe nome, duração e preço" />
      <form onSubmit={submit} noValidate className="grid gap-4 md:max-w-xl">
        <Input id="f-nome" label="Nome do serviço" value={nome} onChange={e => setNome(e.target.value)} error={er.nome} />
        <Input id="f-dur" label="Duração em minutos" inputMode="numeric" hint="Entre 10 e 480 minutos." value={dur}
          onChange={e => setDur(e.target.value.replace(/\D/g, ""))} error={er.dur} />
        <Input id="f-preco" label="Preço" inputMode="numeric" placeholder="R$ 0,00" value={preco}
          onChange={e => { const d = e.target.value.replace(/\D/g, ""); setPreco(d ? brl(parseInt(d, 10)) : ""); }} error={er.preco} />
        {fail && <ErrorBox>Não foi possível concluir. Seus dados foram mantidos; verifique a conexão e tente de novo.</ErrorBox>}
        <div className="flex gap-2">
          <LinkButton href="#servicos" className="flex-1">Cancelar</LinkButton>
          <Button type="submit" variant="primary" disabled={busy} className="flex-1">{busy ? "Salvando…" : "Salvar serviço"}</Button>
        </div>
        {!novo && <Button variant="danger" onClick={remover}>{ask ? "Confirmar remoção" : "Remover serviço"}</Button>}
      </form>
    </>
  );
}
