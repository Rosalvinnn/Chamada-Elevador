import { test, expect, prepararAPIs } from "./helpers.js";

test.describe("Administração", () => {
  test("deve abrir a tela de login", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(
      page.getByRole("heading", { name: "Chamada-Elevador" })
    ).toBeVisible();

    await expect(
      page.getByLabel("Usuário")
    ).toBeVisible();

    await expect(
      page.getByLabel("Senha")
    ).toBeVisible();
  });

  test("deve exibir erro com credenciais inválidas", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          sucesso: false,
          mensagem: "Usuário ou senha inválidos.",
        }),
      });
    });

    await page.goto("/admin/login");

    await page.getByLabel("Usuário").fill("usuario_invalido");
    await page.getByLabel("Senha").fill("senha_invalida");

    await page.getByRole("button", {
      name: "Entrar no painel",
    }).click();

    await expect(
      page.getByText("Usuário ou senha inválidos.")
    ).toBeVisible();
  });

  test("deve acessar o painel com login autorizado", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sucesso: true,
        }),
      });
    });

    await page.route("**/api/admin/elevadores", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sucesso: true,
          elevadores: [],
        }),
      });
    });

    await page.goto("/admin/login");

    await page.getByLabel("Usuário").fill("admin_teste");
    await page.getByLabel("Senha").fill("senha_teste");

    await page.getByRole("button", {
      name: "Entrar no painel",
    }).click();

    await expect(page).toHaveURL(/\/admin$/);

    await expect(
      page.getByRole("heading", { name: "Painel administrativo" })
    ).toBeVisible();
  });

  test("deve impedir acesso sem autenticação", async ({ page }) => {
    await page.route("**/api/admin/elevadores", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          sucesso: false,
          mensagem: "Não autorizado.",
        }),
      });
    });

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
