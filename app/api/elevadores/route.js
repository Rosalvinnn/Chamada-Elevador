import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const applicationId = process.env.BACK4APP_APPLICATION_ID;
    const restApiKey = process.env.BACK4APP_REST_API_KEY;
    const masterKey = process.env.BACK4APP_MASTER_KEY;
    const serverURL = process.env.BACK4APP_SERVER_URL;

    if (!applicationId || !restApiKey || !masterKey || !serverURL) {
      return NextResponse.json(
        { mensagem: "Configuração do Back4App incompleta." },
        { status: 500 }
      );
    }

    const baseURL = serverURL.replace(/\/+$/, "");
    const url = new URL(`${baseURL}/classes/Elevador`);

    url.searchParams.set("limit", "1000");
    url.searchParams.set("order", "bloco,numero");

    const resposta = await fetch(url.toString(), {
      headers: {
        "X-Parse-Application-Id": applicationId,
        "X-Parse-REST-API-Key": restApiKey,
        "X-Parse-Master-Key": masterKey,
      },
      cache: "no-store",
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao consultar elevadores:", dados);

      return NextResponse.json(
        { mensagem: "Não foi possível consultar os elevadores." },
        { status: 502 }
      );
    }

    const elevadores = (dados.results || []).map((elevador) => ({
      objectId: elevador.objectId,
      bloco: elevador.bloco,
      numero: elevador.numero,
      peerId: elevador.peerId || null,
    }));

    return NextResponse.json({
      sucesso: true,
      elevadores,
    });
  } catch (erro) {
    console.error("Erro ao consultar elevadores:", erro);

    return NextResponse.json(
      { mensagem: "Erro interno ao consultar elevadores." },
      { status: 500 }
    );
  }
}