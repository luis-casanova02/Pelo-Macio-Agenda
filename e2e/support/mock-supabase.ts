import type { Page } from "@playwright/test";

export const MOCK_URL = "https://mock.supabase.co";
const INT_MAX = 2147483647; // limite do tipo integer do Postgres
type Row = Record<string, any>;

/**
 * Back-end simulado (PostgREST) em memória, para rodar os testes sem tocar no banco real.
 * Reproduz apenas o que os testes precisam: filtros eq/gte/lte, order, limit, join com servicos,
 * insert/update e o erro "integer out of range". NÃO valida os `check` do schema.sql.
 */
export async function mockSupabase(page: Page) {
  const db = { servicos: [] as Row[], agendamentos: [] as Row[] };
  const ctl = { offline: false };
  let n = 0;
  const uid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "content-type": "application/json" };

  const filtrar = (rows: Row[], q: URLSearchParams) => rows.filter(r => [...q.entries()].every(([k, v]) => {
    if (["select", "order", "limit"].includes(k)) return true;
    const [op, ...rest] = v.split("."), val = rest.join("."), a = String(r[k]);
    return op === "eq" ? a === val : op === "gte" ? a >= val : op === "lte" ? a <= val : true;
  }));

  await page.route(/^https:\/\/mock\.supabase\.co\/rest\/v1\//, async route => {
    const req = route.request(), url = new URL(req.url());
    const table = url.pathname.split("/").pop() as "servicos" | "agendamentos", q = url.searchParams;
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (ctl.offline) return route.abort("failed");
    if (req.method() === "GET") {
      let rows = filtrar(db[table], q);
      const ord = q.get("order");
      if (ord) { const [f, d] = ord.split("."); rows = [...rows].sort((a, b) => String(a[f]).localeCompare(String(b[f])) * (d === "desc" ? -1 : 1)); }
      if (table === "agendamentos" && (q.get("select") ?? "").includes("servicos("))
        rows = rows.map(r => { const s = db.servicos.find(x => x.id === r.servico_id)!; return { ...r, servicos: { nome: s.nome, duracao_min: s.duracao_min } }; });
      const lim = q.get("limit"); if (lim) rows = rows.slice(0, Number(lim));
      return route.fulfill({ status: 200, headers, body: JSON.stringify(rows) });
    }
    if (req.method() === "POST") {
      const body = req.postDataJSON(), items: Row[] = Array.isArray(body) ? body : [body];
      for (const it of items) {
        if (it.preco_centavos > INT_MAX) return route.fulfill({ status: 400, headers, body: JSON.stringify({ code: "22003", message: `value "${it.preco_centavos}" is out of range for type integer` }) });
        db[table].push({ id: uid(), ativo: true, status: "agendado", criado_em: new Date().toISOString(), ...it });
      }
      return route.fulfill({ status: 201, headers, body: "" });
    }
    if (req.method() === "PATCH") { const patch = req.postDataJSON(); filtrar(db[table], q).forEach(r => Object.assign(r, patch)); return route.fulfill({ status: 204, headers }); }
    return route.fulfill({ status: 405, headers });
  });
  return { db, ctl };
}
