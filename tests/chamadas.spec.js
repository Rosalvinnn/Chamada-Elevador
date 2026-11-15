
import { test, expect, prepararAPIs } from "./helpers.js";

test.describe("Sistema de chamadas", () => {
  test.beforeEach(async ({ page }) => {
    await prepararAPIs(page);
    await page.goto("/");
  });

  test("deve simular uma chamada de elevador", async ({ page }) => {
    await page.getByRole("button", {
      name: /Simular chamada — Elevador 1/,
    }).click();

    await expect(
      page.getByRole("button", { name: "Atender chamada" })
    ).toBeVisible();

    await expect(
      page.getByText("Elevador 1")
    ).toBeVisible();
  });

  test("deve atender uma chamada", async ({ page }) => {
    await page.getByRole("button", {
      name: /Simular chamada — Elevador 1/,
    }).click();

    await page.getByRole("button", {
      name: "Atender chamada",
    }).click();

    await expect(
      page.getByText("Chamada em andamento")
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Encerrar chamada" })
    ).toBeVisible();
  });

  test("deve encerrar uma chamada e salvar o histórico", async ({ page }) => {
    let registroEnviado = null;

    await page.route("**/api/historico", async (route) => {
      if (route.request().method() === "POST") {
        registroEnviado = route.request().postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sucesso: true,
            id: "historico-teste-001",
          }),
        });

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sucesso: true,
          historico: [],
        }),
      });
    });

    await page.getByRole("button", {
      name: /Simular chamada — Elevador 1/,
    }).click();

    await page.getByRole("button", {
      name: "Atender chamada",
    }).click();

    await page.getByRole("button", {
      name: "Encerrar chamada",
    }).click();

    await expect.poll(() => registroEnviado).not.toBeNull();

    expect(registroEnviado.elevatorName).toBe("Elevador 1");
    expect(registroEnviado.status).toBe("completed");
    expect(registroEnviado.elevatorId).toBe("teste-a1");

    await expect(
      page.getByText("Nenhuma chamada no momento")
    ).toBeVisible();
  });

  test("deve permitir recusar uma chamada", async ({ page }) => {
    await page.getByRole("button", {
      name: /Simular chamada — Elevador 1/,
    }).click();

    await page.getByRole("button", {
      name: "Recusar",
    }).click();

    await expect(
      page.getByText("Nenhuma chamada no momento")
    ).toBeVisible();
  });

  test("não deve permitir duas chamadas simultâneas", async ({ page }) => {
    await page.getByRole("button", {
      name: /Simular chamada — Elevador 1/,
    }).click();

    const segundoElevador = page.getByRole("button", {
      name: /Simular chamada — Elevador 1/,
    });

    await expect(segundoElevador).not.toBeVisible();
  });
});
