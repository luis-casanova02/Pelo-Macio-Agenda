import { expect, test } from "@playwright/test";
import { mockSupabase } from "./support/mock-supabase";

const amanha = () => { const d = new Date(Date.now() + 864e5); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

/**
 * E2E: fluxo cadastro de serviço + agendamento (RF01, RF02, RF04, RF06, RF07, RF09).
 * Usa nomes únicos e remove o que criou ao final, então pode rodar contra o banco real.
 */
test("cadastra um serviço, agenda um atendimento e limpa os dados", async ({ page }) => {
  if (process.env.MOCK) await mockSupabase(page);
  const uid = String(Date.now()).slice(-6);
  const servico = `E2E Banho ${uid}`, pet = `Pet${uid}`, dia = amanha();
  const hora = `0${1 + Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`; // madrugada de amanhã: evita choque com dados reais

  // 1) Cadastro do serviço
  await page.goto("/#servicos");
  await page.getByRole("link", { name: "+ Novo serviço" }).click();
  await page.getByLabel("Nome do serviço").fill(servico);
  await page.getByLabel("Duração em minutos").fill("45");
  await page.getByLabel("Preço").pressSequentially("5500");
  await expect(page.getByLabel("Preço")).toHaveValue(/R\$\s55,00/);
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page.getByRole("heading", { name: "Serviços" })).toBeVisible();
  await expect(page.getByRole("heading", { name: servico })).toBeVisible();

  // 2) Agendamento usando esse serviço
  await page.getByRole("link", { name: "Agenda", exact: true }).click();
  await page.getByRole("link", { name: "+ Novo agendamento" }).click();
  const value = await page.locator("#f-svc option", { hasText: servico }).getAttribute("value");
  await page.locator("#f-svc").selectOption(value!);
  await page.getByLabel("Data").fill(dia);
  await page.getByLabel("Hora").fill(hora);
  await expect(page.getByText(/Atendimento das/)).toBeVisible();
  await page.getByLabel("Nome do tutor").fill("Tutor Teste E2E");
  await page.getByLabel("Telefone").fill("(49) 99999-9999");
  await page.getByLabel("Nome do pet").fill(pet);
  await page.getByRole("button", { name: "Salvar agendamento" }).click();

  // 3) Aparece na agenda do dia
  const card = page.getByRole("listitem").filter({ hasText: pet });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Agendado");
  await expect(card).toContainText(hora);

  // 4) Limpeza: cancela o agendamento e remove o serviço
  await card.getByRole("button", { name: "Cancelar", exact: true }).click();
  await card.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(card).toContainText("Cancelado");
  await page.getByRole("link", { name: "Serviços", exact: true }).click();
  await page.getByRole("link", { name: `Editar ${servico}` }).click();
  await page.getByRole("button", { name: "Remover serviço" }).click();
  await page.getByRole("button", { name: "Confirmar remoção" }).click();
  await expect(page.getByRole("heading", { name: "Serviços" })).toBeVisible();
  await expect(page.getByRole("heading", { name: servico })).toHaveCount(0);
});
