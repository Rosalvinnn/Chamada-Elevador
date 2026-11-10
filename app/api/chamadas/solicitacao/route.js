
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function tokenValido(request) {
  const tokenRecebido = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  const tokenEsperado = process.env.ELEVATOR_DEVICE_TOKEN;

  if (!tokenRecebido || !tokenEsperado) {
    return false;
  }

  const recebido = Buffer.from(tokenRecebido);
  const esperado = Buffer.from(tokenEsperado);

  if (recebido.length !== esperado.length) {
    return false;
  }

  return timingSafeEqual(recebido, esperado);
}

export async function POST(request) {
  try {
    // 1. Confere a credencial exclusiva do Raspberry Pi.
    if (!tokenValido(request)) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Dispositivo não autorizado." },
        { status: 401 }
      );
    }

    const applicationId = process.env.BACK4APP_APPLICATION_ID;
    const restApiKey = process.env.BACK4APP_REST_API_KEY;
    const masterKey = process.env.BACK4APP_MASTER_KEY;
    const serverURL = process.env.BACK4APP_SERVER_URL;

    if (!applicationId || !restApiKey || !masterKey || !serverURL) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Configuração do servidor incompleta." },
        { status: 500 }
      );
    }

    const baseURL = serverURL.replace(/\/+$/, "");

    const headers = {
      "X-Parse-Application-Id": applicationId,
      "X-Parse-REST-API-Key": restApiKey,
      "X-Parse-Master-Key": masterKey,
      "Content-Type": "application/json",
    };

    // 2. Localiza o Bloco A, Elevador 1.
    const elevadoresURL = new URL(`${baseURL}/classes/Elevador`);
    elevadoresURL.searchParams.set("limit", "1000");

    const respostaElevadores = await fetch(elevadoresURL.toString(), {
      headers,
      cache: "no-store",
    });

    const dadosElevadores = await respostaElevadores.json();

    if (!respostaElevadores.ok) {
      console.error("Erro ao consultar elevadores:", dadosElevadores);

      return NextResponse.json(
        { sucesso: false, mensagem: "Erro ao consultar elevadores." },
        { status: 502 }
      );
    }

    const elevador = (dadosElevadores.results || []).find(
      (item) =>
        String(item.bloco).trim().toUpperCase() === "A" &&
        String(item.numero).trim() === "1"
    );

    if (!elevador) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Bloco A, Elevador 1 não encontrado." },
        { status: 404 }
      );
    }

    // 3. Verifica se já existe uma solicitação aguardando.
    const consultaURL = new URL(
      `${baseURL}/classes/SolicitacoesChamada`
    );

    consultaURL.searchParams.set(
      "where",
      JSON.stringify({
        elevadorId: elevador.objectId,
        status: "pending",
      })
    );

    consultaURL.searchParams.set("limit", "1");

    const respostaConsulta = await fetch(consultaURL.toString(), {
      headers,
      cache: "no-store",
    });

    const dadosConsulta = await respostaConsulta.json();

    if (!respostaConsulta.ok) {
      console.error("Erro ao consultar solicitações:", dadosConsulta);

      return NextResponse.json(
        { sucesso: false, mensagem: "Erro ao verificar solicitações." },
        { status: 502 }
      );
    }

    if (dadosConsulta.results?.length > 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: "Já existe uma chamada aguardando atendimento.",
        duplicada: true,
      });
    }

    // 4. Registra a nova solicitação no Back4App.
    const respostaCriacao = await fetch(
      `${baseURL}/classes/SolicitacoesChamada`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({
          elevadorId: elevador.objectId,
          elevadorNome: `Elevador ${elevador.numero}`,
          bloco: elevador.bloco,
          status: "pending",
        }),
      }
    );

    const dadosCriacao = await respostaCriacao.json();

    if (!respostaCriacao.ok) {
      console.error("Erro ao registrar solicitação:", dadosCriacao);

      return NextResponse.json(
        { sucesso: false, mensagem: "Não foi possível registrar a chamada." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "Solicitação recebida com sucesso.",
      id: dadosCriacao.objectId,
      elevador: "Bloco A - Elevador 1",
    });
  } catch (erro) {
    console.error("Erro ao receber chamada:", erro);

    return NextResponse.json(
      { sucesso: false, mensagem: "Erro interno ao receber chamada." },
      { status: 500 }
    );
  }
}
