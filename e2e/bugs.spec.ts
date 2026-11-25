import { expect, test } from "@playwright/test";
import { mockSupabase } from "./support/mock-supabase";

test.skip(!process.env.MOCK, "Testes de regressão rodam com back-end simulado (MOCK=1)");

const amanha = () => { const d = new Date(Date.now() + 864e5); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const servico = (id: string, nome: string, dur: number) => ({ id, nome, duracao_min: dur, preco_centavos: 6000, ativo: true });

test("BUG-01 · RF03: serviço com agendamento futuro não pode ser removido", async ({ page }) => {
  const { db } = await mockSupabase(page);
  db.servicos.push(servico("s1", "Banho", 60));
  db.agendamentos.push({ id: "a1", servico_id: "s1", data: amanha(), hora: "10:00", tutor: "Ana Becker", telefone: "(49) 99123-4567", pet: "Bidu", status: "agendado" });
  await page.goto("/#servico-s1");
  await page.getByRole("button", { name: "Remover serviço" }).click();
  await page.getByRole("button", { name: "Confirmar remoção" }).click();
  await expect(page.getByRole("alert")).toContainText("agendamentos futuros");
  expect(db.servicos[0].ativo).toBe(true);
});

test("BUG-02 · atendimento não pode passar da meia-noite", async ({ page }) => {
  const { db } = await mockSupabase(page);
  db.servicos.push(servico("s2", "Banho e tosa", 120));
  await page.goto("/#novo");
  await page.getByLabel("Data").fill(amanha());
  await page.getByLabel("Hora").fill("23:00");
  await page.getByLabel("Nome do tutor").fill("João Prado");
  await page.getByLabel("Telefone").fill("(49) 98811-2233");
  await page.getByLabel("Nome do pet").fill("Mel");
  await page.getByRole("button", { name: "Salvar agendamento" }).click();
  await expect(page.locator("#f-hora-e")).toContainText("meia-noite");
  expect(db.agendamentos).toHaveLength(0);
});

test("BUG-03 · preço acima do limite do banco tem mensagem clara", async ({ page }) => {
  const { db } = await mockSupabase(page);
  await page.goto("/#servico-novo");
  await page.getByLabel("Nome do serviço").fill("Banho");
  await page.getByLabel("Duração em minutos").fill("60");
  await page.getByLabel("Preço").pressSequentially("99999999999");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page.locator("#f-preco-e")).toContainText("O preço máximo");
  expect(db.servicos).toHaveLength(0);
});
