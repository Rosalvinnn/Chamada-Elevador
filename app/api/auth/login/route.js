
import { NextResponse } from "next/server";
import { configurarParse, usuarioEhAdmin } from "@/lib/parseServer";

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

    const Parse = configurarParse();

    // Autentica usando o SDK do Parse.
    const user = await Parse.User.logIn(username, password);
    const sessionToken = user.getSessionToken();

    if (!sessionToken || !(await usuarioEhAdmin(Parse, user.id))) {
      return NextResponse.json(
        { mensagem: "Usuário sem permissão administrativa." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      sucesso: true,
      mensagem: "Login realizado.",
    });

    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      { mensagem: "Usuário ou senha inválidos, ou falha na autenticação." },
      { status: 401 }
    );
  }
}
