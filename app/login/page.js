
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(resultado.mensagem || "Não foi possível entrar.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">↕</div>
          <span>Elevador Conectado</span>
        </div>

        <div className="login-heading">
          <span className="login-eyebrow">ÁREA RESTRITA</span>
          <h1>Bem-vindo de volta</h1>
          <p>Entre com sua conta para acessar o painel administrativo.</p>
        </div>

        <form className="login-form" onSubmit={entrar}>
          <div className="login-field">
            <label htmlFor="username">Nome de usuário</label>
            <input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          {erro && (
            <p className="login-error" role="alert">{erro}</p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={carregando}
          >
            {carregando ? "Verificando acesso..." : "Entrar no painel"}
          </button>
        </form>

        <div className="login-footer">
          Acesso exclusivo para administradores autorizados.
        </div>
      </section>
    </main>
  );
}
