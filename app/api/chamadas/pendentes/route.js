
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function obterConfiguracao() {
  const applicationId = process.env.BACK4APP_APPLICATION_ID;
  const restApiKey = process.env.BACK4APP_REST_API_KEY;
  const masterKey = process.env.BACK4APP_MASTER_KEY;
  const serverURL = process.env.BACK4APP_SERVER_URL;

  if (!applicationId || !restApiKey || !masterKey || !serverURL) {
    return null;
  }

  return {
    baseURL: serverURL.replace(/\/+$/, ""),
    headers: {
      "X-Parse-Application-Id": applicationId,
      "X-Parse-REST-API-Key": restApiKey,
      "X-Parse-Master-Key": masterKey,
      "Content-Type": "application/json",
    },
  };
}

export async function GET() {
  try {
    const config = obterConfiguracao();

    if (!config) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Configuração incompleta." },
        { status: 500 }
      );
    }

    const consultaURL = new URL(
      `${config.baseURL}/classes/SolicitacoesChamada`
    );

    consultaURL.searchParams.set(
      "where",
      JSON.stringify({ status: "pending" })
    );

    consultaURL.searchParams.set("order", "createdAt");
    consultaURL.searchParams.set("limit", "50");

    const resposta = await fetch(consultaURL.toString(), {
      headers: config.headers,
      cache: "no-store",
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao consultar chamadas:", dados);

      return NextResponse.json(
        { sucesso: false, mensagem: "Erro ao consultar chamadas." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      solicitacoes: (dados.results || []).map((item) => ({
        id: item.objectId,
        elevadorId: item.elevadorId,
        elevadorNome: item.elevadorNome,
        bloco: item.bloco,
        status: item.status,
        createdAt: item.createdAt,
      })),
    });
  } catch (erro) {
    console.error("Erro ao buscar chamadas pendentes:", erro);

    return NextResponse.json(
      { sucesso: false, mensagem: "Erro interno ao consultar chamadas." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const config = obterConfiguracao();

    if (!config) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Configuração incompleta." },
        { status: 500 }
      );
    }

    const { id } = await request.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { sucesso: false, mensagem: "ID da solicitação inválido." },
        { status: 400 }
      );
    }

    const resposta = await fetch(
      `${config.baseURL}/classes/SolicitacoesChamada/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: config.headers,
        cache: "no-store",
        body: JSON.stringify({
          status: "notified",
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao atualizar solicitação:", dados);

      return NextResponse.json(
        { sucesso: false, mensagem: "Não foi possível atualizar a solicitação." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "Solicitação entregue ao painel.",
    });
  } catch (erro) {
    console.error("Erro ao atualizar solicitação:", erro);

    return NextResponse.json(
      { sucesso: false, mensagem: "Erro interno ao atualizar solicitação." },
      { status: 500 }
    );
  }
}