"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PainelAdmin() {
  const router = useRouter();

  const [bloco, setBloco] = useState("A");
  const [numero, setNumero] = useState("1");
  const [elevadores, setElevadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const carregarElevadores = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
        const resposta = await fetch("/api/admin/elevadores", {
    cache: "no-store",
    });

    const texto = await resposta.text();

    let dados;

    try {
    dados = JSON.parse(texto);
    } catch {
    throw new Error(
        `A API retornou uma resposta inválida (HTTP ${resposta.status}). Confira o terminal.`
    );
    }

      if (resposta.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(dados.mensagem || "Erro ao carregar elevadores.");
      }

      setElevadores(dados.elevadores || []);
    } catch (error) {
      setErro(error.message || "Erro de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    carregarElevadores();
  }, [carregarElevadores]);

  async function cadastrarElevador(event) {
    event.preventDefault();
    setMensagem("");
    setErro("");
    setSalvando(true);

    try {
      const resposta = await fetch("/api/admin/elevadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloco, numero }),
      });

      const dados = await resposta.json();

      if (resposta.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(dados.mensagem || "Não foi possível cadastrar.");
      }

      setMensagem("Elevador cadastrado com sucesso!");
      setNumero("");
      await carregarElevadores();
    } catch (error) {
      setErro(error.message || "Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirElevador(elevador) {
    const confirmado = window.confirm(
      `Deseja excluir o elevador ${elevador.numero} do Bloco ${elevador.bloco}?`
    );

    if (!confirmado) return;

    setMensagem("");
    setErro("");

    try {
      const resposta = await fetch("/api/admin/elevadores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectId: elevador.objectId }),
      });

      const dados = await resposta.json();

      if (resposta.status === 401) {
        router.replace("/admin/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(dados.mensagem || "Não foi possível excluir.");
      }

      setMensagem("Elevador excluído com sucesso!");
      await carregarElevadores();
    } catch (error) {
      setErro(error.message || "Erro de conexão.");
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e5d8dd",
    borderRadius: "9px",
    background: "#fff",
    color: "#321923",
    fontSize: "15px",
    boxSizing: "border-box",
  };

  const botaoStyle = {
    padding: "12px 18px",
    border: 0,
    borderRadius: "9px",
    background: "#781f3b",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px",
        background: "#f7f5f4",
        fontFamily: "Arial, sans-serif",
        color: "#321923",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                color: "#8a2947",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "1px",
              }}
            >
              UNICAP · CHAMADA-ELEVADOR
            </p>
            <h1 style={{ margin: "8px 0", fontSize: "30px" }}>
              Painel administrativo
            </h1>
            <p style={{ color: "#82757a", margin: 0 }}>
              Gerencie os elevadores cadastrados no sistema.
            </p>
          </div>

          <button
            onClick={() => router.push("/elevadores")}
            style={botaoStyle}
          >
            Ver página dos elevadores
          </button>
        </header>

        {mensagem && (
          <p
            role="status"
            style={{
              padding: "12px 16px",
              background: "#e7f5eb",
              color: "#216738",
              borderRadius: "9px",
            }}
          >
            {mensagem}
          </p>
        )}

        {erro && (
          <p
            role="alert"
            style={{
              padding: "12px 16px",
              background: "#fce9ed",
              color: "#9b233d",
              borderRadius: "9px",
            }}
          >
            {erro}
          </p>
        )}

        <section
          style={{
            background: "#fff",
            padding: "26px",
            borderRadius: "16px",
            border: "1px solid #e9e2e1",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "20px" }}>
            Cadastrar elevador
          </h2>
          <p style={{ color: "#82757a", fontSize: "14px" }}>
            Escolha o bloco e informe o número do elevador.
          </p>

          <form
            onSubmit={cadastrarElevador}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              alignItems: "end",
            }}
          >
            <label style={{ display: "grid", gap: "8px", fontWeight: 600 }}>
              Bloco
              <input
                value={bloco}
                onChange={(event) => setBloco(event.target.value)}
                placeholder="Ex.: A"
                maxLength={20}
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: "8px", fontWeight: 600 }}>
              Número do elevador
              <input
                type="number"
                min="1"
                max="999"
                step="1"
                value={numero}
                onChange={(event) => setNumero(event.target.value)}
                placeholder="Ex.: 1"
                required
                style={inputStyle}
              />
            </label>

            <button type="submit" disabled={salvando} style={{
              ...botaoStyle,
              opacity: salvando ? 0.65 : 1,
            }}>
              {salvando ? "Salvando..." : "Cadastrar elevador"}
            </button>
          </form>
        </section>

        <section
          style={{
            background: "#fff",
            padding: "26px",
            borderRadius: "16px",
            border: "1px solid #e9e2e1",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>
              Elevadores cadastrados
            </h2>
            <span
              style={{
                background: "#f4e8ed",
                color: "#781f3b",
                borderRadius: "20px",
                padding: "7px 12px",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {elevadores.length} cadastrados
            </span>
          </div>

          {carregando ? (
            <p style={{ color: "#82757a" }}>Carregando elevadores...</p>
          ) : elevadores.length === 0 ? (
            <p style={{ color: "#82757a" }}>
              Nenhum elevador cadastrado ainda.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {elevadores.map((elevador) => (
                <article
                  key={elevador.objectId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                    padding: "16px",
                    border: "1px solid #eee5e8",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "16px" }}>
                      Bloco {elevador.bloco} · Elevador {elevador.numero}
                    </strong>
                    <p
                      style={{
                        color: "#82757a",
                        fontSize: "12px",
                        margin: "6px 0 0",
                      }}
                    >
                      ID: {elevador.objectId}
                    </p>
                  </div>

                  <button
                    onClick={() => excluirElevador(elevador)}
                    style={{
                      ...botaoStyle,
                      background: "#fff",
                      color: "#a12a43",
                      border: "1px solid #e8cbd3",
                    }}
                  >
                    Excluir
                  </button>
                </article>
              ))}
            </div>
          )}

          <button
            onClick={carregarElevadores}
            disabled={carregando}
            style={{
              ...botaoStyle,
              marginTop: "20px",
              background: "#f4e8ed",
              color: "#781f3b",
            }}
          >
            Atualizar lista
          </button>
        </section>
      </div>
    </main>
  );
}