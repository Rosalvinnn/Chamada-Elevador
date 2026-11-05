
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { mensagem: "Informe o usuário e a senha." },
        { status: 400 }
      );
    }

    const applicationId = process.env.BACK4APP_APPLICATION_ID;
    const restApiKey = process.env.BACK4APP_REST_API_KEY;
    const masterKey = process.env.BACK4APP_MASTER_KEY;
    const serverURL = process.env.BACK4APP_SERVER_URL;

    if (!applicationId || !restApiKey || !masterKey || !serverURL) {
      console.error("Configuração do Back4App incompleta.");

      return NextResponse.json(
        { mensagem: "Configuração do servidor incompleta." },
        { status: 500 }
      );
    }

    const baseURL = serverURL.replace(/\/+$/, "");

    // 1. Autentica o usuário no Back4App.
    const loginResponse = await fetch(
      `${baseURL}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        method: "GET",
        headers: {
          "X-Parse-Application-Id": applicationId,
          "X-Parse-REST-API-Key": restApiKey,
        },
        cache: "no-store",
      }
    );

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      return NextResponse.json(
        { mensagem: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const userId = loginData.objectId;
    const sessionToken = loginData.sessionToken;

    if (!userId || !sessionToken) {
      return NextResponse.json(
        { mensagem: "O Back4App não retornou uma sessão válida." },
        { status: 401 }
      );
    }

    // 2. Verifica se o usuário pertence à função Admin.
    const roleURL = new URL(`${baseURL}/roles`);
    roleURL.searchParams.set(
      "where",
      JSON.stringify({
        name: "Admin",
        users: {
          __type: "Pointer",
          className: "_User",
          objectId: userId,
        },
      })
    );
    roleURL.searchParams.set("limit", "1");

    const roleResponse = await fetch(roleURL.toString(), {
      headers: {
        "X-Parse-Application-Id": applicationId,
        "X-Parse-REST-API-Key": restApiKey,
        "X-Parse-Master-Key": masterKey,
      },
      cache: "no-store",
    });

    const roleData = await roleResponse.json();

    if (!roleResponse.ok) {
      console.error("Erro ao verificar função Admin:", roleData);

      return NextResponse.json(
        { mensagem: "Não foi possível verificar as permissões." },
        { status: 500 }
      );
    }

    if (!roleData.results || roleData.results.length === 0) {
      return NextResponse.json(
        { mensagem: "Usuário sem permissão administrativa." },
        { status: 403 }
      );
    }

    // 3. Cria a sessão protegida no navegador.
    const response = NextResponse.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
    });

    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Falha no login:", {
      mensagem: error.message,
      codigo: error.code,
      status: error.status,
    });

    return NextResponse.json(
      { mensagem: "Erro interno ao realizar login." },
      { status: 500 }
    );
  }
}
