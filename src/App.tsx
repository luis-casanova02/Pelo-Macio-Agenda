import { useEffect, useRef, useState } from "react";
import Agenda from "./screens/Agenda";
import Agendar from "./screens/Agendar";
import Cadastro from "./screens/Cadastro";
import Servicos from "./screens/Servicos";
import { Header } from "./components/ui";
import { supabaseConfigured } from "./lib/supabase";

export default function App() {
  const [h, setH] = useState(location.hash || "#agenda");
  const [msg, setMsg] = useState("");
  const timer = useRef<number>(undefined);

  useEffect(() => {
    const onHash = () => setH(location.hash || "#agenda");
    const onToast = (e: Event) => { setMsg((e as CustomEvent<string>).detail); clearTimeout(timer.current); timer.current = window.setTimeout(() => setMsg(""), 2500); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !["#agenda", "#servicos", ""].includes(location.hash)) history.back(); };
    addEventListener("hashchange", onHash); addEventListener("toast", onToast); addEventListener("keydown", onKey);
    return () => { removeEventListener("hashchange", onHash); removeEventListener("toast", onToast); removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => { document.querySelector<HTMLElement>("h1")?.focus(); window.scrollTo(0, 0); }, [h]);

  const r = h.slice(1);
  const aba = r === "servicos" || r.startsWith("servico-") ? "servicos" : "agenda";
  const tela = r === "novo" ? <Agendar /> : r === "servicos" ? <Servicos /> : r.startsWith("servico-") ? <Cadastro id={r.slice(8)} /> : <Agenda />;
  const link = (href: string, nome: string, on: boolean) => (
    <a href={href} aria-current={on ? "page" : undefined}
      className={`grid min-h-12 place-items-center rounded-xl font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${on ? "bg-blue-100 text-blue-700" : "text-slate-600"}`}>{nome}</a>
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-24 md:pb-8">
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white p-2 md:static md:order-first md:mt-4 md:max-w-xs md:rounded-xl md:border">
        {link("#agenda", "Agenda", aba === "agenda")}{link("#servicos", "Serviços", aba === "servicos")}
      </nav>
      <main className="flex-1">
        {supabaseConfigured ? <div key={r}>{tela}</div> : <>
          <Header title="Falta configurar o banco" />
          <div role="alert" className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 font-semibold text-amber-900">Crie o arquivo <b>.env</b> a partir do <b>.env.example</b> (ou configure as variáveis na Vercel) e reinicie o app.</div></>}
      </main>
      {msg && <div role="status" className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white md:bottom-8">{msg}</div>}
    </div>
  );
}
