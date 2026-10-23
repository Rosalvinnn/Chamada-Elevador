
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { configurarParse, usuarioEhAdmin } from "@/lib/parseServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ autenticado: false }, { status: 401 });
    }

    const Parse = configurarParse();
    const user = await Parse.User.become(sessionToken);

    const autorizado = await usuarioEhAdmin(Parse, user.id);

    if (!autorizado) {
      const response = NextResponse.json(
        { autenticado: false },
        { status: 403 }
      );

      response.cookies.set("admin_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    return NextResponse.json({
      autenticado: true,
      usuario: user.get("username"),
    });
  } catch {
    const response = NextResponse.json(
      { autenticado: false },
      { status: 401 }
    );

    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
