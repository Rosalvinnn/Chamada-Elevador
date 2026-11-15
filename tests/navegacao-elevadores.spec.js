
import { test, expect, prepararAPIs } from "./helpers.js";

test.describe("Navegação e elevadores", () => {
  test.beforeEach(async ({ page }) => {
    await prepararAPIs(page);
  });

  test("deve carregar a página inicial", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Central de chamadas" })
    ).toBeVisible();

    await expect(
      page.getByText("Nenhuma chamada no momento")
    ).toBeVisible();
  });

  test("deve navegar para a página de elevadores", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Elevadores" }).click();

    await expect(page).toHaveURL(/\/elevadores/);

    await expect(
      page.getByRole("heading", { name: "Todos os elevadores" })
    ).toBeVisible();
  });

  test("deve exibir os elevadores cadastrados", async ({ page }) => {
    await page.goto("/elevadores");

    await expect(page.getByText("Elevador 1").first()).toBeVisible();

    await expect(page.getByText("Bloco A").first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Bloco B" })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Bloco D" })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Bloco G" })
    ).toBeVisible();
  });

  test("deve exibir os dispositivos Raspberry Pi", async ({ page }) => {
    await page.goto("/elevadores");

    await expect(
      page.getByRole("heading", { name: "Dispositivos (Raspberry Pi)" })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Simular desconexão" }).first()
    ).toBeVisible();
  });
});
