
import { test, expect } from "@playwright/test";

export { test, expect };

export const elevadoresTeste = [
  {
    objectId: "teste-a1",
    numero: "1",
    bloco: "A",
    peerId: "unicap-elevador-bloco-a-1",
  },
  {
    objectId: "teste-b1",
    numero: "1",
    bloco: "B",
    peerId: "unicap-elevador-bloco-b-1",
  },
  {
    objectId: "teste-d1",
    numero: "1",
    bloco: "D",
    peerId: "unicap-elevador-bloco-d-1",
  },
  {
    objectId: "teste-g1",
    numero: "1",
    bloco: "G",
    peerId: "unicap-elevador-bloco-g-1",
  },
];

export async function prepararAPIs(page) {
  await page.route("**/api/elevadores", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sucesso: true,
        elevadores: elevadoresTeste,
      }),
    });
  });

  await page.route("**/api/historico", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sucesso: true,
          historico: [],
        }),
      });
      return;
    }

    if (route.request().method() === "POST") {
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

    await route.continue();
  });

  await page.route("**/api/chamadas/pendentes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sucesso: true,
        solicitacoes: [],
      }),
    });
  });
}
