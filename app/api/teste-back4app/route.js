
import { NextResponse } from "next/server";
import Parse from "parse/node";

export const runtime = "nodejs";

export async function POST() {
  try {
    const applicationId = process.env.BACK4APP_APPLICATION_ID;
    const masterKey = process.env.BACK4APP_MASTER_KEY;
    const serverURL = process.env.BACK4APP_SERVER_URL;

    if (!applicationId || !masterKey || !serverURL) {
      throw new Error("Configuração do Back4App incompleta.");
    }

    Parse.initialize(applicationId, undefined, masterKey);
    Parse.serverURL = serverURL;

    const TesteConexao = Parse.Object.extend("TesteConexao");
    const registro = new TesteConexao();

    registro.set("mensagem", "Conexão com o backend confirmada");
    registro.set("origem", "Next.js");

    await registro.save(null, { useMasterKey: true });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Conexão com o Back4App realizada!",
      id: registro.id,
    });
  } catch (error) {
    console.error("Erro no teste Back4App:", error.message);

    return NextResponse.json(
      { sucesso: false, mensagem: "Falha na conexão com o Back4App." },
      { status: 500 }
    );
  }
}
