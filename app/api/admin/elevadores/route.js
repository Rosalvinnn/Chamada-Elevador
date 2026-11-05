
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function gerarPeerId(bloco, numero) {
  const blocoSeguro = String(bloco)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `unicap-elevador-${blocoSeguro}-${numero}`;
}

async function verificarAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  const applicationId = process.env.BACK4APP_APPLICATION_ID;
  const restApiKey = process.env.BACK4APP_REST_API_KEY;
  const masterKey = process.env.BACK4APP_MASTER_KEY;
  const serverURL = process.env.BACK4APP_SERVER_URL;

  if (
    !sessionToken ||
    !applicationId ||
    !restApiKey ||
    !masterKey ||
    !serverURL
  ) {
    return null;
  }

  const baseURL = serverURL.replace(/\/+$/, "");

  const headers = {
    "X-Parse-Application-Id": applicationId,
    "X-Parse-REST-API-Key": restApiKey,
  };

  const userResponse = await fetch(`${baseURL}/users/me`, {
    headers: {
      ...headers,
      "X-Parse-Session-Token": sessionToken,
    },
    cache: "no-store",
  });

  if (!userResponse.ok) return null;

  const user = await userResponse.json();

  const roleURL = new URL(`${baseURL}/roles`);

  roleURL.searchParams.set(
    "where",
    JSON.stringify({
      name: "Admin",
      users: {
        __type: "Pointer",
        className: "_User",
        objectId: user.objectId,
      },
    })
  );

  roleURL.searchParams.set("limit", "1");

  const roleResponse = await fetch(roleURL.toString(), {
    headers: {
      ...headers,
      "X-Parse-Master-Key": masterKey,
    },
    cache: "no-store",
  });

  if (!roleResponse.ok) return null;

  const roleData = await roleResponse.json();

  if (!roleData.results?.length) return null;

  return { baseURL, ...headers, masterKey };
}

function headersBack4App(config) {
  return {
    "X-Parse-Application-Id": config["X-Parse-Application-Id"],
    "X-Parse-REST-API-Key": config["X-Parse-REST-API-Key"],
    "X-Parse-Master-Key": config.masterKey,
    "Content-Type": "application/json",
  };
}

async function lerJSON(resposta) {
  const texto = await resposta.text();

  if (!texto) return {};

  try {
    return JSON.parse(texto);
  } catch {
    return {};
  }
}

async function salvarPeerId(config, elevador) {
  if (elevador.peerId) {
    return elevador.peerId;
  }

  const peerId = gerarPeerId(elevador.bloco, elevador.numero);

  const resposta = await fetch(
    `${config.baseURL}/classes/Elevador/${encodeURIComponent(
      elevador.objectId
    )}`,
    {
      method: "PUT",
      headers: headersBack4App(config),
      body: JSON.stringify({ peerId }),
      cache: "no-store",
    }
  );

  const dados = await lerJSON(resposta);

  if (!resposta.ok) {
    console.error("Erro ao salvar Peer ID:", dados);
    throw new Error(
      `Não foi possível salvar o Peer ID do elevador ${elevador.bloco}-${elevador.numero}.`
    );
  }

  return peerId;
}

export async function GET() {
  try {
    const config = await verificarAdmin();

    if (!config) {
      return NextResponse.json(
        { mensagem: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const url = new URL(`${config.baseURL}/classes/Elevador`);

    url.searchParams.set("limit", "1000");
    url.searchParams.set("order", "bloco,numero");

    const resposta = await fetch(url.toString(), {
      headers: headersBack4App(config),
      cache: "no-store",
    });

    const dados = await lerJSON(resposta);

    if (!resposta.ok) {
      console.error("Erro ao listar elevadores:", dados);

      return NextResponse.json(
        { mensagem: "Não foi possível listar os elevadores." },
        { status: 502 }
      );
    }

    const elevadores = [];

    for (const elevador of dados.results || []) {
      const peerId = await salvarPeerId(config, elevador);

      elevadores.push({
        ...elevador,
        peerId,
      });
    }

    return NextResponse.json({
      sucesso: true,
      elevadores,
    });
  } catch (error) {
    console.error("Erro na listagem:", error);

    return NextResponse.json(
      {
        mensagem: error.message || "Erro interno ao listar elevadores.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const config = await verificarAdmin();

    if (!config) {
      return NextResponse.json(
        { mensagem: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bloco =
      typeof body.bloco === "string"
        ? body.bloco.trim().toUpperCase()
        : "";

    const numero = Number(body.numero);

    if (
      !/^[A-Z0-9_-]{1,20}$/.test(bloco) ||
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > 999
    ) {
      return NextResponse.json(
        {
          mensagem:
            "Informe um bloco válido e um número entre 1 e 999.",
        },
        { status: 400 }
      );
    }

    const consulta = new URL(`${config.baseURL}/classes/Elevador`);

    consulta.searchParams.set(
      "where",
      JSON.stringify({ bloco, numero })
    );

    consulta.searchParams.set("limit", "1");

    const consultaResposta = await fetch(consulta.toString(), {
      headers: headersBack4App(config),
      cache: "no-store",
    });

    const consultaDados = await lerJSON(consultaResposta);

    if (!consultaResposta.ok) {
      console.error("Erro ao verificar duplicidade:", consultaDados);

      return NextResponse.json(
        { mensagem: "Não foi possível validar o cadastro." },
        { status: 502 }
      );
    }

    if (consultaDados.results?.length) {
      return NextResponse.json(
        {
          mensagem:
            "Esse elevador já está cadastrado nesse bloco.",
        },
        { status: 409 }
      );
    }

    const peerId = gerarPeerId(bloco, numero);

    const resposta = await fetch(
      `${config.baseURL}/classes/Elevador`,
      {
        method: "POST",
        headers: headersBack4App(config),
        body: JSON.stringify({
          bloco,
          numero,
          peerId,
        }),
        cache: "no-store",
      }
    );

    const dados = await lerJSON(resposta);

    if (!resposta.ok) {
      console.error("Erro ao cadastrar elevador:", dados);

      return NextResponse.json(
        { mensagem: "Não foi possível salvar o elevador." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Elevador cadastrado com sucesso.",
        elevador: {
          objectId: dados.objectId,
          bloco,
          numero,
          peerId,
          createdAt: dados.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no cadastro:", error);

    return NextResponse.json(
      { mensagem: "Erro interno ao cadastrar elevador." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const config = await verificarAdmin();

    if (!config) {
      return NextResponse.json(
        { mensagem: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const objectId =
      typeof body.objectId === "string" ? body.objectId : "";

    if (!/^[a-zA-Z0-9]+$/.test(objectId)) {
      return NextResponse.json(
        { mensagem: "Identificador inválido." },
        { status: 400 }
      );
    }

    const resposta = await fetch(
      `${config.baseURL}/classes/Elevador/${encodeURIComponent(
        objectId
      )}`,
      {
        method: "DELETE",
        headers: headersBack4App(config),
        cache: "no-store",
      }
    );

    if (!resposta.ok) {
      const erro = await lerJSON(resposta);

      console.error("Erro ao excluir elevador:", erro);

      return NextResponse.json(
        { mensagem: "Não foi possível excluir o elevador." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "Elevador excluído com sucesso.",
    });
  } catch (error) {
    console.error("Erro na exclusão:", error);

    return NextResponse.json(
      { mensagem: "Erro interno ao excluir elevador." },
      { status: 500 }
    );
  }
}