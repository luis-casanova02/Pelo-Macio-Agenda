import { Card, Empty, ErrorBox, Header, Loading, LinkButton } from "../components/ui";
import { listServicos } from "../lib/api";
import { useLoad } from "../lib/useLoad";
import { brl } from "../lib/util";

/** Tela 1 · Lista de serviços (SELECT apenas dos ativos). */
export default function Servicos() {
  const { st, data, reload } = useLoad(listServicos, []);
  return (
    <>
      <Header title="Serviços" sub="Duração e preço de cada atendimento" />
      <div className="mb-4"><LinkButton href="#servico-novo" variant="primary">+ Novo serviço</LinkButton></div>
      {st === "loading" && <Loading />}
      {st === "error" && <ErrorBox onRetry={reload}>Não foi possível carregar os serviços.</ErrorBox>}
      {st === "ok" && (data!.length === 0
        ? <Empty title="Nenhum serviço cadastrado">Cadastre o primeiro para poder agendar.</Empty>
        : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data!.map(s => (
              <li key={s.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div><h2 className="font-bold">{s.nome}</h2><p className="text-sm text-slate-600">{s.duracao_min} min · {brl(s.preco_centavos)}</p></div>
                  <LinkButton small href={`#servico-${s.id}`} aria-label={`Editar ${s.nome}`}>Editar</LinkButton>
                </Card>
              </li>
            ))}
          </ul>)}
    </>
  );
}
