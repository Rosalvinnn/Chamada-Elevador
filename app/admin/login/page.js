"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginAdmin() {
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
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            setErro(dados.mensagem || "Não foi possível entrar.");
            return;
        }

        router.push("/admin");
        } catch {
        setErro("Erro de conexão. Tente novamente.");
        } finally {
        setCarregando(false);
        }
    }

    return (
        <main className="login-container">
        <section className="login-card">
            <header className="login-brand">
            <div className="login-logo">CE</div>
            <div>
                <h1>Chamada-Elevador</h1>
                <p>UNICAP · Sistema de atendimento</p>
            </div>
            </header>

            <div className="login-heading">
            <span className="login-label">ÁREA RESTRITA</span>
            <h2>Bem-vindo de volta</h2>
            <p>Entre com sua conta de administrador.</p>
            </div>

            <form onSubmit={entrar}>
            <label htmlFor="username">Usuário</label>
            <input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
            />

            <label htmlFor="password">Senha</label>
            <input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
            />

            {erro && <p className="login-error">{erro}</p>}

            <button type="submit" disabled={carregando}>
                {carregando ? "Verificando acesso..." : "Entrar no painel"}
            </button>
            </form>

            <p className="login-footer">
            Acesso exclusivo para administradores autorizados.
            </p>
        </section>
        </main>
    );
    }