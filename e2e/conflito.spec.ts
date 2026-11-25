import { expect, test, type Page } from "@playwright/test";
import { mockSupabase } from "./support/mock-supabase";

test.skip(!process.env.MOCK, "Roda com back-end simulado (MOCK=1)");

const amanha = () => { const d = new Date(Date.now() + 864e5); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
async function agendar(page: Page, hora: string, pet: string) {
  await page.goto("/#novo");
  await page.getByLabel("Data").fill(amanha());
  await page.getByLabel("Hora").fill(hora);
  await page.getByLabel("Nome do tutor").fill("Tutor Teste");
  await page.getByLabel("Telefone").fill("(49) 99999-9999");
  await page.getByLabel("Nome do pet").fill(pet);
  await page.getByRole("button", { name: "Salvar agendamento" }).click();
}

test.describe("RF05 · conflito de horário (US-03)", () => {
  test("CT-CF1 (−) horário sobreposto é bloqueado com aviso", async ({ page }) => {
    const { db } = await mockSupabase(page);
    db.servicos.push({ id: "s1", nome: "Banho", duracao_min: 60, preco_centavos: 6000, ativo: true });
    db.agendamentos.push({ id: "a1", servico_id: "s1", data: amanha(), hora: "10:00", tutor: "Ana", telefone: "(49) 99123-4567", pet: "Bidu", status: "agendado" });
    await agendar(page, "10:30", "Rex");
    await expect(page.getByRole("alert")).toContainText("Bidu");
    expect(db.agendamentos).toHaveLength(1);
  });
  test("CT-CF2 (+) horário encostado (fim = início) é permitido", async ({ page }) => {
    const { db } = await mockSupabase(page);
    db.servicos.push({ id: "s1", nome: "Banho", duracao_min: 60, preco_centavos: 6000, ativo: true });
    db.agendamentos.push({ id: "a1", servico_id: "s1", data: amanha(), hora: "10:00", tutor: "Ana", telefone: "(49) 99123-4567", pet: "Bidu", status: "agendado" });
    await agendar(page, "11:00", "Rex");
    await expect(page.getByRole("listitem").filter({ hasText: "Rex" })).toBeVisible();
    expect(db.agendamentos).toHaveLength(2);
  });
  test("CT-CF3 (+) agendamento cancelado libera o horário", async ({ page }) => {
    const { db } = await mockSupabase(page);
    db.servicos.push({ id: "s1", nome: "Banho", duracao_min: 60, preco_centavos: 6000, ativo: true });
    db.agendamentos.push({ id: "a1", servico_id: "s1", data: amanha(), hora: "10:00", tutor: "Ana", telefone: "(49) 99123-4567", pet: "Bidu", status: "cancelado" });
    await agendar(page, "10:30", "Rex");
    await expect(page.getByRole("listitem").filter({ hasText: "Rex" })).toBeVisible();
  });
});
