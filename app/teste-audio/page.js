
"use client";

import { useEffect, useRef, useState } from "react";

const ELEVATOR_PEER_ID = "unicap-elevador-bloco-a-1";

export default function TesteAudioPage() {
  const [mode, setMode] = useState("elevador");
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState(ELEVATOR_PEER_ID);
  const [status, setStatus] = useState("Conectando ao serviço...");
  const [incoming, setIncoming] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const peerRef = useRef(null);
  const callRef = useRef(null);
  const incomingCallRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function setup() {
      try {
        const { default: Peer } = await import("peerjs");

        if (!active) return;

        const peer = new Peer(
          mode === "elevador" ? ELEVATOR_PEER_ID : undefined,
          {
            config: {
              iceServers: [
                {
                  urls: "stun:stun.l.google.com:19302",
                },
              ],
            },
          }
        );

        peerRef.current = peer;

        peer.on("open", (id) => {
          if (!active) return;

          setMyId(id);
          setStatus(
            mode === "elevador"
              ? "Elevador conectado e aguardando chamadas"
              : "Central conectada e pronta para ligar"
          );
        });

        peer.on("call", (call) => {
          if (!active) {
            call.close();
            return;
          }

          incomingCallRef.current = call;
          setIncoming(true);
          setStatus("Chamada recebida");
        });

        peer.on("error", (err) => {
          if (!active) return;

          console.error("Erro PeerJS:", err);

          if (err.type === "unavailable-id") {
            setError(
              "Este ID já está sendo usado. Feche a outra sessão do elevador."
            );
          } else {
            setError(err.message || "Erro de conexão.");
          }

          setStatus("Falha na conexão");
        });
      } catch (err) {
        if (active) {
          setError(
            err.message || "Não foi possível iniciar o serviço de chamadas."
          );
          setStatus("Erro ao iniciar");
        }
      }
    }

    setMyId("");
    setError("");
    setIncoming(false);
    setConnected(false);
    setStatus("Conectando ao serviço...");

    setup();

    return () => {
      active = false;

      if (callRef.current) {
        callRef.current.close();
        callRef.current = null;
      }

      if (incomingCallRef.current) {
        incomingCallRef.current.close();
        incomingCallRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      }

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [mode]);

  async function getMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Microfone indisponível. Verifique se está usando HTTPS."
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

    localStreamRef.current = stream;
    return stream;
  }

  function listenToCall(call) {
    callRef.current = call;

    call.on("stream", async (stream) => {
      if (!remoteAudioRef.current) return;

      remoteAudioRef.current.srcObject = stream;

      try {
        await remoteAudioRef.current.play();
      } catch {
        setStatus("Toque em Reproduzir áudio para ouvir");
      }

      setConnected(true);
      setIncoming(false);
      setStatus("Ligação em andamento");
      setError("");
    });

    call.on("close", () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      }

      callRef.current = null;
      incomingCallRef.current = null;

      setConnected(false);
      setIncoming(false);
      setStatus("Ligação encerrada");
    });

    call.on("error", (err) => {
      setError(err.message || "Falha durante a ligação.");
    });
  }

  async function makeCall() {
    try {
      setError("");

      if (!remoteId.trim()) {
        setError("Digite o código do elevador.");
        return;
      }

      setStatus("Solicitando acesso ao microfone...");

      const stream = await getMicrophone();
      const call = peerRef.current?.call(remoteId.trim(), stream);

      if (!call) {
        throw new Error("Não foi possível iniciar a chamada.");
      }

      listenToCall(call);
      setStatus("Chamando o elevador...");
    } catch (err) {
      setError(err.message || "Não foi possível iniciar a chamada.");
      setStatus("Não foi possível ligar");
    }
  }

  async function answerCall() {
    try {
      setError("");
      setStatus("Atendendo...");

      const call = incomingCallRef.current;

      if (!call) {
        throw new Error("Não há chamada aguardando.");
      }

      const stream = await getMicrophone();

      call.answer(stream);
      listenToCall(call);

      setIncoming(false);
      setStatus("Conectando o áudio...");
    } catch (err) {
      setError(err.message || "Não foi possível atender.");
      setStatus("Falha ao atender");
    }
  }

  function hangUp() {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }

    if (incomingCallRef.current) {
      incomingCallRef.current.close();
      incomingCallRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    setConnected(false);
    setIncoming(false);
    setStatus("Ligação encerrada");
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(myId);
      setStatus("Código copiado!");
    } catch {
      setError("Copie o código manualmente.");
    }
  }

  return (
    <main
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "32px 20px",
        color: "#281820",
      }}
    >
      <p style={{ color: "#8b3152", fontWeight: 700 }}>
        UNICAP CONECTA / LABORATÓRIO
      </p>

      <h1>Teste de chamada de áudio</h1>

      <p style={{ color: "#806c75" }}>
        Escolha se este dispositivo representará o elevador ou a central.
      </p>

      <section
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setMode("elevador")}
          disabled={mode === "elevador"}
        >
          Modo Elevador
        </button>

        <button
          onClick={() => setMode("central")}
          disabled={mode === "central"}
        >
          Modo Central
        </button>
      </section>

      <section
        style={{
          background: "#f4eef1",
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}
      >
        <h2>1. Identificação do dispositivo</h2>

        <p>
          {mode === "elevador"
            ? "Este dispositivo representa o Elevador 1 do Bloco A."
            : "Este dispositivo representa a central de atendimento."}
        </p>

        <code
          style={{
            display: "block",
            padding: 12,
            background: "#fff",
            borderRadius: 8,
            overflowWrap: "anywhere",
          }}
        >
          {myId || "Conectando..."}
        </code>

        <button
          onClick={copyId}
          disabled={!myId}
          style={{ marginTop: 10 }}
        >
          Copiar código
        </button>
      </section>

      {mode === "central" && (
        <section style={{ marginTop: 24 }}>
          <h2>2. Ligar para o elevador</h2>

          <label htmlFor="remote-id">ID do elevador</label>

          <input
            id="remote-id"
            value={remoteId}
            onChange={(event) => setRemoteId(event.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginTop: 8,
              marginBottom: 12,
              border: "1px solid #d8c5cd",
              borderRadius: 8,
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={makeCall}
            disabled={!myId || connected || incoming}
          >
            Ligar para o elevador
          </button>
        </section>
      )}

      <section
        style={{
          marginTop: 24,
          border: "1px solid #eadde2",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h2>Estado da ligação</h2>

        <p aria-live="polite">{status}</p>

        {incoming && (
          <div>
            <p>Um dispositivo está ligando para você.</p>
            <button onClick={answerCall}>Atender chamada</button>
          </div>
        )}

        {connected && (
          <p style={{ color: "#15803d", fontWeight: 700 }}>
            Áudio conectado!
          </p>
        )}

        <audio ref={remoteAudioRef} autoPlay />

        <button
          onClick={async () => {
            try {
              await remoteAudioRef.current?.play();
              setStatus("Reproduzindo áudio");
            } catch {
              setError("Não foi possível reproduzir o áudio.");
            }
          }}
        >
          Reproduzir áudio
        </button>

        <button
          onClick={hangUp}
          style={{
            marginLeft: 8,
            background: "#8b3152",
            color: "#fff",
          }}
        >
          Encerrar
        </button>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}
      </section>
    </main>
  );
}