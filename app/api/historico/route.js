import { NextResponse } from "next/server";

export const runtime = "nodejs";

function obterConfiguracao() {
  const applicationId = process.env.BACK4APP_APPLICATION_ID;
  const restApiKey = process.env.BACK4APP_REST_API_KEY;
  const masterKey = process.env.BACK4APP_MASTER_KEY;
  const serverURL = process.env.BACK4APP_SERVER_URL;

  if (!applicationId || !masterKey || !serverURL) {
    throw new Error("Configuração do Back4App incompleta.");
  }

  return {
    applicationId,
    masterKey,
    baseURL: serverURL.replace(/\/+$/, ""),
  };
}

function headersBack4App(config) {
  return {
    "X-Parse-Application-Id": config.applicationId,
    "X-Parse-Master-Key": config.masterKey,
    "Content-Type": "application/json",
  };
}

function converterData(data) {
  if (!data) return null;

  return {
    __type: "Date",
    iso: new Date(data).toISOString(),
  };
}

function converterRegistro(registro) {
  return {
    id: registro.objectId,
    elevatorId: registro.elevadorId,
    elevatorName: registro.elevadorNome,
    block: registro.bloco,
    location: registro.origem,
    origin: registro.origem,

    createdAt: registro.dataInicio
      ? new Date(registro.dataInicio.iso).getTime()
      : null,

    answeredAt: registro.dataAtendimento
      ? new Date(registro.dataAtendimento.iso).getTime()
      : null,

    endedAt: registro.dataFim
      ? new Date(registro.dataFim.iso).getTime()
      : null,

    waitSeconds: registro.tempoEspera ?? 0,
    durationSeconds: registro.duracao ?? 0,
    status: registro.status,
    demo: false,
  };
}

export async function GET() {
  try {
    const config = obterConfiguracao();

    const url = new URL(
      `${config.baseURL}/classes/HistoricoChamadas`
    );

    url.searchParams.set("limit", "1000");
    url.searchParams.set("order", "-dataInicio");

    const resposta = await fetch(url.toString(), {
      headers: headersBack4App(config),
      cache: "no-store",
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao consultar histórico:", dados);

      return NextResponse.json(
        { sucesso: false, mensagem: "Erro ao consultar histórico." },
        { status: 502 }
      );
    }

    const historico = (dados.results || []).map(converterRegistro);

    return NextResponse.json({
      sucesso: true,
      historico,
    });
  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);

    return NextResponse.json(
      { sucesso: false, mensagem: "Erro interno ao carregar histórico." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const config = obterConfiguracao();
    const dados = await request.json();

    if (
      !dados.elevatorId ||
      !dados.elevatorName ||
      !dados.createdAt ||
      !["completed", "refused"].includes(dados.status)
    ) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Dados da chamada inválidos." },
        { status: 400 }
      );
    }

    const registro = {
      elevadorId: String(dados.elevatorId),
      elevadorNome: String(dados.elevatorName),
      bloco: String(dados.block || ""),
      origem: String(dados.origin || ""),
      dataInicio: converterData(dados.createdAt),
      dataAtendimento: converterData(dados.answeredAt),
      dataFim: converterData(dados.endedAt),
      tempoEspera: Math.max(0, Number(dados.waitSeconds) || 0),
      duracao: Math.max(0, Number(dados.durationSeconds) || 0),
      status: dados.status,
    };

    const resposta = await fetch(
      `${config.baseURL}/classes/HistoricoChamadas`,
      {
        method: "POST",
        headers: headersBack4App(config),
        body: JSON.stringify(registro),
      }
    );

    const resultado = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao salvar chamada:", resultado);

      return NextResponse.json(
        { sucesso: false, mensagem: "Não foi possível salvar a chamada." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      id: resultado.objectId,
      mensagem: "Chamada salva com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao registrar chamada:", erro);

    return NextResponse.json(
      { sucesso: false, mensagem: "Erro interno ao salvar chamada." },
      { status: 500 }
    );
  }
}