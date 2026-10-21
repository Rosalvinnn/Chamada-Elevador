
"use client";

import { useEffect, useRef, useState } from "react";

export default function TesteAudioPage() {
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
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

        const peer = new Peer(undefined, {
          config: {
            iceServers: [
              {
                urls: "stun:stun.l.google.com:19302",
              },
            ],
          },
        });

        peerRef.current = peer;

        peer.on("open", (id) => {
          if (!active) return;
          setMyId(id);
          setStatus("Pronto para conectar");
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
          setError(err.message || "Erro de conexão.");
          setStatus("Falha na conexão");
        });

      } catch {
        if (active) {
          setError("Não foi possível iniciar o serviço de chamadas.");
          setStatus("Erro ao iniciar");
        }
      }
    }

    setup();

    return () => {
      active = false;

      if (callRef.current) callRef.current.close();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

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
        setError("Digite o código do outro dispositivo.");
        return;
      }

      setStatus("Solicitando acesso ao microfone...");

      const stream = await getMicrophone();
      const call = peerRef.current.call(remoteId.trim(), stream);

      if (!call) {
        throw new Error("Não foi possível iniciar a chamada.");
      }

      listenToCall(call);
      setStatus("Chamando o outro dispositivo...");
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
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

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
        Use o computador e o celular para simular uma ligação
        entre o elevador e a sala de atendimento.
      </p>

      <section
        style={{
          background: "#f4eef1",
          borderRadius: 12,
          padding: 20,
          marginTop: 24,
        }}
      >
        <h2>1. Seu código de conexão</h2>

        <p>Este código identifica o dispositivo atual.</p>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <code
            style={{
              padding: 12,
              background: "#fff",
              borderRadius: 8,
              overflowWrap: "anywhere",
            }}
          >
            {myId || "Gerando código..."}
          </code>

          <button onClick={copyId} disabled={!myId}>
            Copiar código
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>2. Ligar para outro dispositivo</h2>

        <label htmlFor="remote-id">
          Código mostrado no outro dispositivo
        </label>

        <input
          id="remote-id"
          value={remoteId}
          onChange={(event) => setRemoteId(event.target.value)}
          placeholder="Cole o código aqui"
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

        <button onClick={makeCall} disabled={!myId || connected || incoming}>
          Ligar
        </button>
      </section>

      <section
        style={{
          marginTop: 24,
          border: "1px solid #eadde2",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h2>3. Estado da ligação</h2>

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
