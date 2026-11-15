
import { test, expect, prepararAPIs } from "./helpers.js";

test.describe("Histórico e configurações", () => {
  test.beforeEach(async ({ page }) => {
    await prepararAPIs(page);
  });

  test("deve abrir a página de histórico", async ({ page }) => {
    await page.goto("/historico");

    await expect(
      page.getByRole("heading", { name: "Histórico de Chamadas" })
    ).toBeVisible();

    await expect(
      page.getByText("Nenhuma chamada registrada")
    ).toBeVisible();
  });

  test("deve exibir a tabela de chamadas quando houver registros", async ({ page }) => {
    await page.route("**/api/historico", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sucesso: true,
            historico: [
              {
                id: "teste-001",
                elevatorId: "teste-a1",
                elevatorName: "Elevador 1",
                block: "Bloco A",
                createdAt: new Date(2026, 10, 15, 12, 0).getTime(),
                answeredAt: new Date(2026, 10, 15, 12, 1).getTime(),
                endedAt: new Date(2026, 10, 15, 12, 3).getTime(),
                waitSeconds: 60,
                durationSeconds: 120,
                status: "completed",
                origin: "Elevador 1 — Bloco A",
              },
            ],
          }),
        });

        return;
      }

      await route.continue();
    });

    await page.goto("/historico");

    await expect(
      page.getByRole("table")
    ).toBeVisible();

    await expect(
      page.getByText("Concluída")
    ).toBeVisible();

    await expect(
      page.getByText("Elevador 1").first()
    ).toBeVisible();
  });

  test("deve abrir as configurações", async ({ page }) => {
    await page.goto("/configuracoes");

    await expect(
      page.getByRole("heading", { name: "Configurações" })
    ).toBeVisible();

    await expect(
      page.getByText("Nome do operador")
    ).toBeVisible();

    await expect(
      page.getByText("Sala de atendimento")
    ).toBeVisible();
  });

  test("deve salvar as configurações do operador", async ({ page }) => {
    await page.goto("/configuracoes");

    await page.getByPlaceholder("Ex.: Laura S.").fill("Rosalvo");

    await page.getByPlaceholder(
      "Ex.: Sala de Atendimento — Campus Central"
    ).fill("Sala de Testes");

    await page.getByRole("button", {
      name: "Salvar configurações",
    }).click();

    await expect(
      page.getByPlaceholder("Ex.: Laura S.")
    ).toHaveValue("Rosalvo");

    await expect(
      page.getByPlaceholder("Ex.: Sala de Atendimento — Campus Central")
    ).toHaveValue("Sala de Testes");
  });
});
