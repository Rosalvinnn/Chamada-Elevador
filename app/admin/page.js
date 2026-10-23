
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      try {
        const resposta = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!resposta.ok) {
          router.replace("/login");
          return;
        }

        const dados = await resposta.json();

        if (ativo) {
          setUsuario(dados.usuario);
          setVerificando(false);
        }
      } catch {
        router.replace("/login");
      }
    }

    verificarSessao();

    return () => {
      ativo = false;
    };
  }, [router]);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (verificando) {
    return <main style={{ padding: 32 }}>Verificando acesso...</main>;
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Painel administrativo</h1>
      <p>Bem-vindo, {usuario}!</p>
      <p>Seu acesso administrativo foi validado.</p>
      <button onClick={sair}>Sair</button>
    </main>
  );
}
