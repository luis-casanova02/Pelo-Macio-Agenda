import { expect, test, type Page } from "@playwright/test";
import { mockSupabase } from "./support/mock-supabase";

test.skip(!process.env.MOCK, "Casos da US-01 rodam com back-end simulado (MOCK=1)");

const campos = (p: Page) => ({
  nome: p.getByLabel("Nome do serviço"), dur: p.getByLabel("Duração em minutos"), preco: p.getByLabel("Preço"),
  salvar: p.getByRole("button", { name: "Salvar serviço" }),
});
async function abrir(page: Page) {
  const m = await mockSupabase(page);
  await page.goto("/#servico-novo");
  await expect(campos(page).nome).toBeVisible();
  return m;
}
async function preencher(page: Page, nome: string, dur: string, centavos: string) {
  const c = campos(page);
  await c.nome.fill(nome); await c.dur.fill(dur); await c.preco.fill(""); if (centavos) await c.preco.pressSequentially(centavos);
}

test("CT-01 · AC1 (+) valores-limite válidos são aceitos", async ({ page }) => {
  const { db } = await abrir(page);
  await preencher(page, "Spa", "10", "1");
  await campos(page).salvar.click();
  await expect(page.getByRole("heading", { name: "Spa" })).toBeVisible();
  expect(db.servicos[0]).toMatchObject({ nome: "Spa", duracao_min: 10, preco_centavos: 1 });
});
test("CT-02 · AC1 (−) nome com 2 caracteres é rejeitado", async ({ page }) => {
  const { db } = await abrir(page);
  await preencher(page, "Sp", "60", "6000");
  await campos(page).salvar.click();
  await expect(page.getByText("Digite o nome com pelo menos 3 letras.")).toBeVisible();
  expect(db.servicos).toHaveLength(0);
});
test("CT-03 · AC1 (−) duração 9 e 481 são rejeitadas", async ({ page }) => {
  const { db } = await abrir(page);
  for (const d of ["9", "481"]) {
    await preencher(page, "Banho", d, "6000");
    await campos(page).salvar.click();
    await expect(page.getByText("Use um número inteiro entre 10 e 480.")).toBeVisible();
  }
  expect(db.servicos).toHaveLength(0);
});
test("CT-04 · AC1 (−) preço vazio e R$ 0,00 são rejeitados", async ({ page }) => {
  const { db } = await abrir(page);
  for (const p of ["", "0"]) {
    await preencher(page, "Banho", "60", p);
    await campos(page).salvar.click();
    await expect(page.getByText("Informe um preço maior que R$ 0,00.")).toBeVisible();
  }
  expect(db.servicos).toHaveLength(0);
});
test("CT-05 · AC2 (−) letras e símbolos são descartados na duração", async ({ page }) => {
  await abrir(page);
  const { dur } = campos(page);
  await dur.pressSequentially("6a0.5");
  await expect(dur).toHaveValue("605");
  await dur.fill(""); await dur.pressSequentially("abc");
  await expect(dur).toHaveValue("");
});
test("CT-06 · AC3 (+) preço é formatado em R$ ao digitar", async ({ page }) => {
  await abrir(page);
  const { preco } = campos(page);
  await preco.pressSequentially("11000");
  await expect(preco).toHaveValue(/R\$\s110,00/);
  await preco.fill(""); await preco.pressSequentially("1100000");
  await expect(preco).toHaveValue(/R\$\s11\.000,00/);
});
test("CT-07 · AC4 (+) serviço aparece na lista em menos de 1 s após salvar", async ({ page }) => {
  await abrir(page);
  await preencher(page, "Banho", "60", "6000");
  await campos(page).salvar.click();
  await expect(page.getByRole("heading", { name: "Banho" })).toBeVisible({ timeout: 1000 });
});
test("CT-08 · AC5 cancelar descarta os dados sem gravar nada", async ({ page }) => {
  const { db } = await abrir(page);
  await preencher(page, "Banho", "60", "6000");
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page.getByText("Nenhum serviço cadastrado")).toBeVisible();
  expect(db.servicos).toHaveLength(0);
});
test("CT-09 · AC6 (−) erro de rede mostra mensagem amigável e mantém os dados", async ({ page }) => {
  const { db, ctl } = await abrir(page);
  await preencher(page, "Banho", "60", "6000");
  ctl.offline = true;
  await campos(page).salvar.click();
  await expect(page.getByRole("alert")).toContainText("Seus dados foram mantidos");
  await expect(campos(page).nome).toHaveValue("Banho");
  await expect(campos(page).dur).toHaveValue("60");
  expect(db.servicos).toHaveLength(0);
  ctl.offline = false;                       // tentar de novo funciona
  await campos(page).salvar.click();
  await expect(page.getByRole("heading", { name: "Banho" })).toBeVisible();
});
