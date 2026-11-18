import "./style.css";
import { supabase, supabaseConfigured } from "./lib/supabase";

/* ===== Tipos (espelham o schema.sql) ===== */
type Servico = { id: string; nome: string; duracao_min: number; preco_centavos: number };
type Status = "agendado" | "cancelado" | "no-show";
type Agendamento = {
  id: string; servico_id: string; data: string; hora: string;
  tutor: string; telefone: string; pet: string; status: Status;
  servicos: { nome: string; duracao_min: number };
};

/* ===== Estado e utilidades ===== */
const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const TODAY = iso(new Date());
const state = { date: TODAY, pending: null as string | null };
let servicos: Servico[] = [];
let agenda: Agendamento[] = [];

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const toMin = (h: string) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const toHM = (m: number) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const svcOf = (id: string) => servicos.find(s => s.id === id);
const NET_ERR = "Não foi possível concluir. Verifique a conexão e tente de novo.";

let tt: number | undefined;
function toast(msg: string) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(tt); tt = window.setTimeout(() => (t.hidden = true), 2500);
}

/* ===== Acesso a dados (Supabase) ===== */
async function loadServicos() {
  const { data, error } = await supabase.from("servicos").select("*").order("nome");
  if (error) throw error;
  servicos = data as Servico[];
}
async function loadAgenda() {
  const { data, error } = await supabase.from("agendamentos")
    .select("*, servicos(nome, duracao_min)").eq("data", state.date).order("hora");
  if (error) throw error;
  agenda = data as unknown as Agendamento[];
}
/** US-03: há conflito se [início, fim) intersecta outro agendamento ativo do mesmo dia. */
async function conflito(data: string, hora: string, servicoId: string): Promise<Agendamento | null> {
  const s = svcOf(servicoId); if (!s || !data || !hora) return null;
  const { data: rows, error } = await supabase.from("agendamentos")
    .select("*, servicos(nome, duracao_min)").eq("data", data).eq("status", "agendado");
  if (error) throw error;
  const a = toMin(hora), b = a + s.duracao_min;
  return (rows as unknown as Agendamento[]).find(x => a < toMin(x.hora) + x.servicos.duracao_min && toMin(x.hora) < b) ?? null;
}

/* ===== Navegação ===== */
const nav = (cur: string) => `<nav aria-label="Principal">
  <a href="#agenda" ${cur === "agenda" ? 'aria-current="page"' : ""}>Agenda</a>
  <a href="#servicos" ${cur === "servicos" ? 'aria-current="page"' : ""}>Serviços</a></nav>`;
const linkBtn = (href: string, label: string, cls = "") =>
  `<a class="btn ${cls}" style="display:grid;place-items:center;text-decoration:none" href="${href}">${label}</a>`;

/* ===== Tela 1: Agenda do dia ===== */
const chip: Record<Status, [string, string]> = { agendado: ["ok", "Agendado"], cancelado: ["off", "Cancelado"], "no-show": ["no", "Não veio"] };
function vAgenda(): string {
  const items = agenda.map(a => {
    const [k, l] = chip[a.status], p = state.pending === a.id, act = a.status === "agendado", ini = a.hora.slice(0, 5);
    return `<li class="card appt ${act ? "" : "off"}">
      <div class="time">${ini}<small>até ${toHM(toMin(ini) + a.servicos.duracao_min)}</small></div>
      <div><div class="row between"><h2>${esc(a.pet)} · ${esc(a.servicos.nome)}</h2><span class="chip ${k}">${l}</span></div>
      <p class="meta">${esc(a.tutor)} · ${esc(a.telefone)}</p>
      ${act ? `<div class="actions">${p
        ? `<button class="btn sm danger" data-do="cancel" data-id="${a.id}">Confirmar cancelamento</button><button class="btn sm" data-do="keep">Voltar</button>`
        : `<button class="btn sm" data-do="ask" data-id="${a.id}">Cancelar</button><button class="btn sm" data-do="noshow" data-id="${a.id}" ${a.data > TODAY ? 'disabled aria-label="Não veio (indisponível para datas futuras)"' : ""}>Não veio</button>`}</div>` : ""}
      </div></li>`;
  }).join("");
  return `<header><h1 tabindex="-1">Agenda</h1><p>${fmtDate(state.date)}</p></header>
  <main><div class="datebar"><button class="btn" data-do="day" data-d="-1" aria-label="Dia anterior">‹</button>
    <input type="date" id="dt" value="${state.date}" aria-label="Escolher data"><button class="btn" data-do="day" data-d="1" aria-label="Próximo dia">›</button></div>
  ${agenda.length ? `<ul class="list">${items}</ul>` : `<div class="empty"><strong>Nenhum agendamento neste dia</strong>Toque em “Novo agendamento” para marcar o primeiro.</div>`}</main>
  <div class="fab">${linkBtn("#novo", "+ Novo agendamento", "primary")}</div>${nav("agenda")}`;
}

/* ===== Tela 2: Novo agendamento ===== */
function vNovo(): string {
  if (!servicos.length) {
    return `<header><h1 tabindex="-1">Novo agendamento</h1></header><main><div class="empty"><strong>Cadastre um serviço antes</strong>Os agendamentos usam a duração do serviço para evitar conflitos.<p>${linkBtn("#servico-novo", "Cadastrar serviço", "primary")}</p></div></main>${nav("agenda")}`;
  }
  return `<header><h1 tabindex="-1">Novo agendamento</h1><p>Preencha os dados do atendimento</p></header>
  <main><form id="f" novalidate>
   <div id="cf" role="alert" class="alert" hidden></div>
   <label>Serviço<select name="svc" aria-describedby="e-svc">${servicos.map(s => `<option value="${s.id}">${esc(s.nome)} · ${s.duracao_min} min · ${brl(s.preco_centavos)}</option>`).join("")}</select><span class="err" id="e-svc"></span></label>
   <div class="two"><label>Data<input type="date" name="data" value="${state.date < TODAY ? TODAY : state.date}" aria-describedby="e-data"><span class="err" id="e-data"></span></label>
   <label>Hora<input type="time" name="hora" aria-describedby="e-hora"><span class="err" id="e-hora"></span></label></div>
   <div class="end" id="end" aria-live="polite">Escolha a hora para ver o término.</div>
   <label>Nome do tutor<input name="tutor" autocomplete="name" aria-describedby="e-tutor"><span class="err" id="e-tutor"></span></label>
   <label>Telefone<input name="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="(49) 99999-9999" aria-describedby="e-tel"><span class="err" id="e-tel"></span></label>
   <label>Nome do pet<input name="pet" aria-describedby="e-pet"><span class="err" id="e-pet"></span></label>
   <p class="meta">Guardamos só nome, telefone e nome do pet, para organizar a agenda (LGPD).</p>
   <div class="row">${linkBtn("#agenda", "Cancelar", "grow")}<button class="btn primary grow" type="submit">Salvar agendamento</button></div>
  </form></main>${nav("agenda")}`;
}
function bindNovo() {
  const f = $<HTMLFormElement>("#f");
  if (!f) return;
  const fld = (k: string) => f.elements.namedItem(k) as HTMLInputElement;
  const vals = () => Object.fromEntries(new FormData(f)) as Record<string, string>;
  let seq = 0;
  const upd = async (): Promise<Agendamento | null> => {
    const my = ++seq, v = vals(), s = svcOf(v.svc);
    $("#end").innerHTML = v.hora && s ? `Atendimento das <b>${v.hora}</b> às <b>${toHM(toMin(v.hora) + s.duracao_min)}</b>` : "Escolha a hora para ver o término.";
    let c: Agendamento | null = null;
    try { c = await conflito(v.data, v.hora, v.svc); } catch { /* erro de rede é tratado ao salvar */ }
    if (my !== seq) return c;
    const box = $("#cf"); box.hidden = !c;
    if (c) box.textContent = `Conflito: ${c.pet} já está marcado das ${c.hora.slice(0, 5)} às ${toHM(toMin(c.hora) + c.servicos.duracao_min)}. Escolha outro horário.`;
    return c;
  };
  f.addEventListener("input", () => { void upd(); });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const v = vals(), er: Record<string, string> = {}, now = new Date();
    if (!v.data) er.data = "Informe a data."; else if (v.data < TODAY) er.data = "A data não pode estar no passado.";
    if (!v.hora) er.hora = "Informe a hora."; else if (v.data === TODAY && toMin(v.hora) < now.getHours() * 60 + now.getMinutes()) er.hora = "Esse horário já passou.";
    if (v.tutor.trim().length < 3) er.tutor = "Digite o nome com pelo menos 3 letras.";
    if (!/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(v.tel.trim())) er.tel = "Digite o telefone com DDD, ex.: (49) 99999-9999.";
    if (!v.pet.trim()) er.pet = "Informe o nome do pet.";
    for (const k of ["svc", "data", "hora", "tutor", "tel", "pet"]) { $("#e-" + k).textContent = er[k] || ""; fld(k).setAttribute("aria-invalid", String(!!er[k])); }
    const first = Object.keys(er)[0]; if (first) { fld(first).focus(); return; }
    try {
      if (await upd()) { $("#cf").scrollIntoView({ block: "center" }); return; }
      const { error } = await supabase.from("agendamentos").insert({
        servico_id: v.svc, data: v.data, hora: v.hora, tutor: v.tutor.trim(), telefone: v.tel.trim(), pet: v.pet.trim(),
      });
      if (error) throw error;
      state.date = v.data; toast("Agendamento salvo"); location.hash = "agenda";
    } catch { toast("Não foi possível salvar. Seus dados foram mantidos; tente de novo."); } // US-02 AC6
  });
}

/* ===== Tela 3: Serviços ===== */
function vServicos(): string {
  const items = servicos.map(s => `<li class="card svc row between"><div><h2>${esc(s.nome)}</h2><p class="meta">${s.duracao_min} min · ${brl(s.preco_centavos)}</p></div>
    <a class="btn sm" style="display:grid;place-items:center;text-decoration:none" href="#servico-${s.id}" aria-label="Editar ${esc(s.nome)}">Editar</a></li>`).join("");
  return `<header><h1 tabindex="-1">Serviços</h1><p>Duração e preço de cada atendimento</p></header>
  <main>${servicos.length ? `<ul class="list">${items}</ul>` : `<div class="empty"><strong>Nenhum serviço cadastrado</strong>Cadastre o primeiro para poder agendar.</div>`}</main>
  <div class="fab">${linkBtn("#servico-novo", "+ Novo serviço", "primary")}</div>${nav("servicos")}`;
}

/* ===== Tela 4: Novo / editar serviço ===== */
function vServico(id: string): string {
  const s = id === "novo" ? { nome: "", duracao_min: "", preco_centavos: 0 } : svcOf(id);
  if (!s) { location.hash = "servicos"; return ""; }
  return `<header><h1 tabindex="-1">${id === "novo" ? "Novo serviço" : "Editar serviço"}</h1><p>Informe nome, duração e preço</p></header>
  <main><form id="f" novalidate>
   <label>Nome do serviço<input name="nome" value="${esc(s.nome)}" aria-describedby="e-nome"><span class="err" id="e-nome"></span></label>
   <label>Duração em minutos<input name="dur" inputmode="numeric" value="${s.duracao_min}" aria-describedby="h-dur e-dur"><span class="hint" id="h-dur">Entre 10 e 480 minutos.</span><span class="err" id="e-dur"></span></label>
   <label>Preço<input name="preco" inputmode="numeric" value="${s.preco_centavos ? brl(s.preco_centavos) : ""}" placeholder="R$ 0,00" aria-describedby="e-preco"><span class="err" id="e-preco"></span></label>
   <div class="row">${linkBtn("#servicos", "Cancelar", "grow")}<button class="btn primary grow" type="submit">Salvar serviço</button></div>
   ${id !== "novo" ? `<button type="button" class="btn danger" id="del">Excluir serviço</button>` : ""}
  </form></main>${nav("servicos")}`;
}
function bindServico(id: string) {
  const f = $<HTMLFormElement>("#f");
  if (!f) return;
  const fld = (k: string) => f.elements.namedItem(k) as HTMLInputElement;
  fld("preco").addEventListener("input", e => { const t = e.target as HTMLInputElement, d = t.value.replace(/\D/g, ""); t.value = d ? brl(parseInt(d, 10)) : ""; });
  fld("dur").addEventListener("input", e => { const t = e.target as HTMLInputElement; t.value = t.value.replace(/\D/g, ""); });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f)) as Record<string, string>, er: Record<string, string> = {};
    const dur = parseInt(v.dur, 10), preco = parseInt(v.preco.replace(/\D/g, "") || "0", 10);
    if (v.nome.trim().length < 3) er.nome = "Digite o nome com pelo menos 3 letras.";
    if (!(dur >= 10 && dur <= 480)) er.dur = "Use um número inteiro entre 10 e 480.";
    if (!(preco > 0)) er.preco = "Informe um preço maior que R$ 0,00.";
    for (const k of ["nome", "dur", "preco"]) { $("#e-" + k).textContent = er[k] || ""; fld(k).setAttribute("aria-invalid", String(!!er[k])); }
    const first = Object.keys(er)[0]; if (first) { fld(first).focus(); return; }
    const row = { nome: v.nome.trim(), duracao_min: dur, preco_centavos: preco };
    try {
      const { error } = id === "novo" ? await supabase.from("servicos").insert(row) : await supabase.from("servicos").update(row).eq("id", id);
      if (error) throw error;
      toast("Serviço salvo"); location.hash = "servicos";
    } catch { toast("Não foi possível salvar. Seus dados foram mantidos; tente de novo."); } // US-01 AC6
  });
  const del = document.querySelector<HTMLButtonElement>("#del");
  del?.addEventListener("click", async () => {
    if (del.dataset.ok !== "1") { del.dataset.ok = "1"; del.textContent = "Confirmar exclusão"; return; }
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) { toast(error.code === "23503" ? "Há agendamentos com este serviço. Cancele-os antes de excluir." : NET_ERR); return; }
    toast("Serviço excluído"); location.hash = "servicos";
  });
}

/* ===== Telas auxiliares ===== */
const vSetup = () => `<header><h1 tabindex="-1">Falta configurar o banco</h1></header><main><div class="alert">Crie o arquivo <b>.env</b> a partir do <b>.env.example</b> com a URL e a chave pública do seu projeto Supabase e reinicie o <b>npm run dev</b>.</div></main>`;
const vErro = () => `<header><h1 tabindex="-1">Sem conexão com o banco</h1></header><main><div class="alert">Não foi possível carregar os dados. Verifique a internet e as chaves do <b>.env</b>, e confirme que o <b>schema.sql</b> foi executado.</div><p><button class="btn primary" data-do="reload">Tentar de novo</button></p></main>${nav("agenda")}`;

/* ===== Roteador (hash) e eventos ===== */
async function route() {
  const h = (location.hash || "#agenda").slice(1), app = $("#app");
  state.pending = null;
  if (!supabaseConfigured) { app.innerHTML = vSetup(); return; }
  try {
    if (h === "novo") { await loadServicos(); app.innerHTML = vNovo(); bindNovo(); }
    else if (h === "servicos") { await loadServicos(); app.innerHTML = vServicos(); }
    else if (h.startsWith("servico-")) {
      const id = h.slice(8); await loadServicos(); app.innerHTML = vServico(id); bindServico(id);
    } else { await loadServicos(); await loadAgenda(); app.innerHTML = vAgenda(); }
  } catch { app.innerHTML = vErro(); }
  document.querySelector<HTMLElement>("h1")?.focus(); window.scrollTo(0, 0);
}
async function render(focusId?: string, refetch = true) {
  const y = scrollY;
  if (refetch) await loadAgenda();
  $("#app").innerHTML = vAgenda(); scrollTo(0, y);
  (document.querySelector<HTMLElement>(focusId ? `[data-id="${focusId}"]` : "#dt"))?.focus();
}
async function act(k: string, id?: string, d?: string) {
  try {
    if (k === "reload") await route();
    else if (k === "day") { state.date = iso(new Date(new Date(state.date + "T12:00:00").getTime() + Number(d) * 864e5)); await render(); }
    else if (k === "ask") { state.pending = id!; await render(id, false); }
    else if (k === "keep") { state.pending = null; await render(undefined, false); }
    else if (k === "cancel" || k === "noshow") {
      const { error } = await supabase.from("agendamentos").update({ status: k === "cancel" ? "cancelado" : "no-show" }).eq("id", id!);
      if (error) throw error;
      state.pending = null; toast(k === "cancel" ? "Agendamento cancelado" : "Marcado como não veio"); await render();
    }
  } catch { toast(NET_ERR); }
}
addEventListener("hashchange", () => { void route(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (state.pending) { state.pending = null; void render(undefined, false); }
  else if (location.hash && location.hash !== "#agenda" && location.hash !== "#servicos") history.back();
});
document.addEventListener("change", e => {
  const t = e.target as HTMLInputElement;
  if (t.id === "dt" && t.value) { state.date = t.value; void render(); }
});
document.addEventListener("click", e => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-do]");
  if (b) void act(b.dataset.do!, b.dataset.id, b.dataset.d);
});
void route();
