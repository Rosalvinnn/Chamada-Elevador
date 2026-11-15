"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { CENTRAL_PEER_ID, criarOpcoesPeer } from "@/lib/peerConfig";

const STATUS = {
  iniciando: { texto: "Iniciando…", cor: "#806c75" },
  "sem-microfone": { texto: "Microfone indisponível", cor: "#b91c1c" },
  conectando: { texto: "Conectando ao serviço de chamadas…", cor: "#b45309" },
  pronto: { texto: "Pronto. Aguardando a central.", cor: "#15803d" },
  "em-ligacao": { texto: "Em ligação com a central", cor: "#8b3152" },
  reconectando: { texto: "Conexão perdida. Reconectando…", cor: "#b45309" },
};

export default function DispositivoElevadorPage() {
  const params = useParams();
  const peerId = decodeURIComponent(String(params?.peerId ?? ""));

  const [status, setStatus] = useState("iniciando");
  const [erro, setErro] = useState("");
  const [audioLiberado, setAudioLiberado] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    if (!/^[A-Za-z0-9_-]+$/.test(peerId)) {
      setErro("Identificador do elevador inválido.");
      return undefined;
    }

    let ativo = true;
    let peer = null;
    let micStream = null;
    let mediaCall = null;
    let controle = null;
    let timerReinicio = null;

    // ---------- Áudio ----------

    function tocarAudioRemoto(streamRemoto) {
      const audio = audioRef.current;
      if (!audio) return;

      audio.srcObject = streamRemoto;

      audio.play().catch(() => {
        // Navegador bloqueou o autoplay. Em testes fora do Raspberry,
        // clique em "Ativar áudio" antes de a central ligar.
        setAudioLiberado(false);
        setErro("Toque em “Ativar áudio” para ouvir a central.");
      });
    }

    function pararAudioRemoto() {
      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();
      audio.srcObject = null;
    }

    function mutarMicrofone(mudo) {
      if (!micStream) return;
      micStream.getAudioTracks().forEach((track) => {
        track.enabled = !mudo;
      });
    }

    async function obterMicrofone() {
      const vivo =
        micStream &&
        micStream.getAudioTracks().some((track) => track.readyState === "live");

      if (vivo) return micStream;

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microfone indisponível. A página precisa estar em HTTPS."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      stream.getAudioTracks().forEach((track) => {
        track.enabled = false; // mudo até uma ligação começar
      });

      micStream = stream;
      return stream;
    }

    // ---------- Ligação ----------

    function encerrarLigacao() {
      const call = mediaCall;
      mediaCall = null;

      mutarMicrofone(true);
      pararAudioRemoto();

      if (call) {
        try {
          call.close();
        } catch {
          /* já estava fechada */
        }
      }
    }

    // ---------- Conexão com o PeerJS ----------

    function limparPeer() {
      encerrarLigacao();

      if (controle) {
        try {
          controle.close();
        } catch {
          /* ignora */
        }
        controle = null;
      }

      if (peer) {
        const antigo = peer;
        peer = null;
        try {
          antigo.destroy();
        } catch {
          /* ignora */
        }
      }
    }

    function agendarReinicio(ms = 5000) {
      if (!ativo || timerReinicio) return;

      limparPeer();
      setStatus("reconectando");

      timerReinicio = setTimeout(() => {
        timerReinicio = null;
        iniciar();
      }, ms);
    }

    async function iniciar() {
      if (!ativo) return;

      setStatus("iniciando");

      // 1. Microfone
      try {
        await obterMicrofone();
      } catch (e) {
        if (!ativo) return;
        setStatus("sem-microfone");
        setErro(e?.message || "Não foi possível acessar o microfone.");
        agendarReinicio(8000);
        return;
      }

      if (!ativo) return;

      // 2. PeerJS
      setStatus("conectando");

      let Peer;
      try {
        ({ default: Peer } = await import("peerjs"));
      } catch (e) {
        if (!ativo) return;
        setErro(e?.message || "Não foi possível carregar o PeerJS.");
        agendarReinicio(8000);
        return;
      }

      if (!ativo) return;

      const novo = new Peer(peerId, criarOpcoesPeer());
      peer = novo;

      novo.on("open", () => {
        if (!ativo || peer !== novo) return;
        setErro("");
        setStatus("pronto");
      });

      novo.on("disconnected", () => {
        if (!ativo || peer !== novo) return;

        setStatus("reconectando");

        setTimeout(() => {
          if (ativo && peer === novo && !novo.destroyed && novo.disconnected) {
            novo.reconnect();
          }
        }, 3000);
      });

      novo.on("close", () => {
        if (ativo && peer === novo) agendarReinicio();
      });

      novo.on("error", (err) => {
        if (!ativo || peer !== novo) return;

        console.error("Erro PeerJS do elevador:", err);

        if (err.type === "peer-unavailable") return;

        if (err.type === "unavailable-id") {
          setErro(
            "O ID deste elevador ainda está em uso por outra sessão. Tentando de novo…"
          );
        } else {
          setErro(err.message || "Erro de conexão.");
        }

        agendarReinicio();
      });

      // Canal de controle aberto pela central (serve para "encerrar").
      novo.on("connection", (conn) => {
        if (conn.peer !== CENTRAL_PEER_ID) {
          conn.close();
          return;
        }

        if (controle && controle !== conn) {
          try {
            controle.close();
          } catch {
            /* ignora */
          }
        }

        controle = conn;

        conn.on("data", (dados) => {
          if (dados?.tipo === "encerrar_chamada") {
            encerrarLigacao();
            if (ativo && peer === novo) setStatus("pronto");
          }
        });

        conn.on("close", () => {
          if (controle === conn) controle = null;
        });
      });

      // Ligação de áudio vinda da central: atende automaticamente.
      novo.on("call", async (call) => {
        // Só a central pode ligar.
        if (call.peer !== CENTRAL_PEER_ID) {
          call.close();
          return;
        }

        try {
          const stream = await obterMicrofone();

          if (!ativo || peer !== novo) {
            call.close();
            return;
          }

          // Se já havia uma ligação, a nova substitui a antiga.
          if (mediaCall) {
            const antiga = mediaCall;
            mediaCall = null;
            try {
              antiga.close();
            } catch {
              /* ignora */
            }
          }

          mediaCall = call;
          mutarMicrofone(false);

          call.on("stream", (streamRemoto) => {
            if (mediaCall === call) tocarAudioRemoto(streamRemoto);
          });

          call.on("close", () => {
            if (mediaCall === call) {
              encerrarLigacao();
              if (ativo && peer === novo) setStatus("pronto");
            }
          });

          call.on("error", (err) => {
            console.error("Erro na ligação:", err);
            setErro(err?.message || "Falha durante a ligação.");
          });

          call.answer(stream);
          setErro("");
          setStatus("em-ligacao");
        } catch (e) {
          console.error("Não foi possível atender:", e);
          setErro(e?.message || "Não foi possível atender a ligação.");
          try {
            call.close();
          } catch {
            /* ignora */
          }
        }
      });
    }

    iniciar();

    return () => {
      ativo = false;

      if (timerReinicio) {
        clearTimeout(timerReinicio);
        timerReinicio = null;
      }

      limparPeer();

      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        micStream = null;
      }
    };
  }, [peerId]);

  function ativarAudio() {
    // O clique libera a reprodução automática neste navegador.
    audioRef.current?.play().catch(() => {});
    setAudioLiberado(true);
    setErro("");
  }

  const info = STATUS[status] ?? STATUS.iniciando;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        background: "#281820",
        color: "#fff",
      }}
    >
      <p style={{ margin: 0, color: "#d9a3b8", fontWeight: 700 }}>
        UNICAP Conecta
      </p>

      <h1 style={{ margin: 0, fontSize: "2rem" }}>Dispositivo do elevador</h1>

      <p
        aria-live="polite"
        style={{
          margin: 0,
          padding: "12px 20px",
          borderRadius: 999,
          background: info.cor,
          fontSize: "1.25rem",
          fontWeight: 700,
        }}
      >
        {info.texto}
      </p>

      <p style={{ margin: 0, color: "#d8c5cd", overflowWrap: "anywhere" }}>
        ID deste elevador: <code>{peerId}</code>
      </p>

      {erro && (
        <p role="alert" style={{ margin: 0, color: "#fca5a5", maxWidth: 520 }}>
          {erro}
        </p>
      )}

      {!audioLiberado && (
        <button
          type="button"
          onClick={ativarAudio}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #d9a3b8",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Ativar áudio (necessário só em testes fora do Raspberry)
        </button>
      )}

      <audio ref={audioRef} autoPlay />
    </main>
  );
}