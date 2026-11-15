"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  callCenterReducer,
  createInitialState,
} from "@/lib/callCenterReducer";

import {
  CENTRAL_PEER_ID,
  criarOpcoesPeer,
} from "@/lib/peerConfig";

// Erros do PeerJS que NÃO significam que a central ficou offline.
const ERROS_PEER_NAO_FATAIS = ["peer-unavailable", "webrtc"];

const CallCenterContext = createContext(null);

export function CallCenterProvider({ children }) {
  const [state, dispatch] = useReducer(
    callCenterReducer,
    undefined,
    createInitialState
  );

  const [toasts, setToasts] = useState([]);

  // Referências da conexão PeerJS.
  const peerRef = useRef(null);
  const [peerReady, setPeerReady] = useState(false);

  // Áudio da ligação atual.
  const mediaCallRef = useRef(null); // ligação de áudio (WebRTC)
  const controlConnRef = useRef(null); // canal de controle ("encerrar")
  const localStreamRef = useRef(null); // microfone do atendente
  const remoteAudioRef = useRef(null); // alto-falante do atendente
  const answeringRef = useRef(false); // evita clique duplo em "Atender"
  const activeCallRef = useRef(null); // chamada ativa (para callbacks)

  // "idle" | "connecting" | "connected"
  const [audioStatus, setAudioStatus] = useState("idle");

  const pushToast = useCallback((mensagem, tipo = "info") => {
    const id = `${Date.now()}-${Math.random()}`;

    setToasts((atuais) => [
      ...atuais,
      { id, message: mensagem, type: tipo },
    ]);

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((atuais) =>
      atuais.filter((toast) => toast.id !== id)
    );
  }, []);

  // Mantém uma referência sempre atual da chamada ativa.
  useEffect(() => {
    activeCallRef.current = state.activeCall;
  }, [state.activeCall]);

  // Elemento de áudio que toca a voz do elevador.
  useEffect(() => {
    const audio = new Audio();
    audio.autoplay = true;
    remoteAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.srcObject = null;
      remoteAudioRef.current = null;
    };
  }, []);

  // Inicializa a conexão PeerJS da central.
  useEffect(() => {
    let ativo = true;

    async function iniciarPeer() {
      try {
        const { default: Peer } = await import("peerjs");

        if (!ativo) return;

        // ID fixo: os elevadores só aceitam ligações deste ID.
        const peer = new Peer(CENTRAL_PEER_ID, criarOpcoesPeer());

        peerRef.current = peer;

        peer.on("open", (id) => {
          if (!ativo) return;

          console.log("Central PeerJS conectada:", id);
          setPeerReady(true);
        });

        peer.on("error", (erro) => {
          console.error("Erro PeerJS da central:", erro);

          if (ERROS_PEER_NAO_FATAIS.includes(erro.type)) return;

          setPeerReady(false);

          if (erro.type === "unavailable-id") {
            pushToast(
              "Já existe outra central aberta (ou a anterior ainda não expirou). Feche as outras abas e recarregue.",
              "error"
            );
          }
        });

        // Perdeu o servidor de sinalização: tenta reconectar mantendo o ID.
        peer.on("disconnected", () => {
          setPeerReady(false);
          console.log("Central desconectada do servidor PeerJS.");

          setTimeout(() => {
            if (
              ativo &&
              peerRef.current === peer &&
              !peer.destroyed &&
              peer.disconnected
            ) {
              peer.reconnect();
            }
          }, 3000);
        });

        peer.on("close", () => {
          setPeerReady(false);
          console.log("Conexão PeerJS da central encerrada.");
        });
      } catch (erro) {
        console.error("Erro ao iniciar PeerJS:", erro);
      }
    }

    iniciarPeer();

    return () => {
      ativo = false;

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [pushToast]);

  // Carrega os elevadores do Back4App.
  useEffect(() => {
    let ativo = true;

    async function carregarElevadores() {
      try {
        const resposta = await fetch("/api/elevadores", {
          cache: "no-store",
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
          console.error(
            "Erro ao carregar elevadores:",
            dados
          );
          return;
        }

        const lista = (dados.elevadores ?? []).map(
          (elevador) => ({
            id: elevador.objectId,
            name: `Elevador ${elevador.numero}`,
            block: elevador.bloco,
            location: `Bloco ${elevador.bloco}`,
            peerId: elevador.peerId || null,
            status: "available",
            lastInspection: "—",
            noiseLevel: 0,
          })
        );

        if (ativo) {
          dispatch({
            type: "SYNC_ELEVATORS",
            elevators: lista,
          });
        }
      } catch (erro) {
        console.error(
          "Erro ao carregar elevadores:",
          erro
        );
      }
    }

    carregarElevadores();

    const intervalo = setInterval(
      carregarElevadores,
      15000
    );

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, []);

  // Carrega o histórico salvo no Back4App.
  useEffect(() => {
    let ativo = true;

    async function carregarHistorico() {
      try {
        const resposta = await fetch("/api/historico", {
          cache: "no-store",
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
          console.error(
            "Erro ao carregar histórico:",
            dados
          );
          return;
        }

        if (ativo) {
          dispatch({
            type: "SYNC_HISTORY",
            history: dados.historico,
          });
        }
      } catch (erro) {
        console.error(
          "Erro ao consultar histórico:",
          erro
        );
      }
    }

    carregarHistorico();

    return () => {
      ativo = false;
    };
  }, []);

  // Atualiza o relógio.
  useEffect(() => {
    const intervalo = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  // Salva uma chamada finalizada no Back4App.
  const salvarHistorico = useCallback(
    async (call, status) => {
      console.log("TENTANDO SALVAR:", call, status);

      const endedAt = Date.now();

      const waitSeconds = call.answeredAt
        ? Math.max(
            0,
            Math.floor(
              (call.answeredAt - call.createdAt) / 1000
            )
          )
        : Math.max(
            0,
            Math.floor(
              (endedAt - call.createdAt) / 1000
            )
          );

      const durationSeconds = call.answeredAt
        ? Math.max(
            0,
            Math.floor(
              (endedAt - call.answeredAt) / 1000
            )
          )
        : 0;

      const registro = {
        elevatorId: call.elevatorId,
        elevatorName: call.elevatorName,
        block: call.block,
        origin: `${call.elevatorName} — ${
          call.block || "Bloco não informado"
        }`,
        createdAt: call.createdAt,
        answeredAt: call.answeredAt,
        endedAt,
        waitSeconds,
        durationSeconds,
        status,
      };

      try {
        console.log("ENVIANDO PARA API:", registro);

        const resposta = await fetch("/api/historico", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registro),
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
          console.error(
            "Não foi possível salvar a chamada:",
            dados
          );

          pushToast(
            "A chamada foi finalizada, mas não foi possível salvar no banco.",
            "error"
          );

          return false;
        }

        dispatch({
          type: "UPDATE_HISTORY_ID",
          temporaryId: call.id,
          newId: dados.id,
        });

        return true;
      } catch (erro) {
        console.error(
          "Erro ao enviar histórico:",
          erro
        );

        pushToast(
          "Erro de conexão ao salvar o histórico.",
          "error"
        );

        return false;
      }
    },
    [pushToast]
  );

  const simulateCall = useCallback(
    (elevatorId, demo = true) => {
      const elevator = state.elevators.find(
        (item) => item.id === elevatorId
      );

      if (!elevator) {
        pushToast(
          "Elevador não encontrado.",
          "error"
        );
        return;
      }

      if (state.activeCall) {
        pushToast(
          "Já existe uma chamada em andamento.",
          "warning"
        );
        return;
      }

      dispatch({
        type: "SIMULATE_CALL",
        elevatorId,
        demo,
      });

      pushToast(
        `Chamada iniciada: ${elevator.name}.`,
        "success"
      );
    },
    [state.elevators, state.activeCall, pushToast]
  );

  // Consulta chamadas físicas pendentes automaticamente.
  useEffect(() => {
    if (
      state.activeCall ||
      !state.elevators.length
    ) {
      return;
    }

    let ativo = true;
    let buscando = false;

    async function verificarChamadas() {
      if (buscando) return;

      buscando = true;

      try {
        const resposta = await fetch(
          "/api/chamadas/pendentes",
          {
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
          console.error(
            "Erro ao consultar chamadas pendentes:",
            dados
          );
          return;
        }

        if (
          !ativo ||
          !dados.solicitacoes?.length
        ) {
          return;
        }

        const solicitacao = dados.solicitacoes.find(
          (item) =>
            state.elevators.some(
              (elevador) =>
                elevador.id === item.elevadorId
            )
        );

        if (!solicitacao) {
          return;
        }

        // Marca a solicitação como entregue ao painel.
        const respostaConfirmacao = await fetch(
          "/api/chamadas/pendentes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: solicitacao.id,
            }),
          }
        );

        const confirmacao =
          await respostaConfirmacao.json();

        if (
          !respostaConfirmacao.ok ||
          !confirmacao.sucesso
        ) {
          console.error(
            "Erro ao confirmar solicitação:",
            confirmacao
          );
          return;
        }

        if (!ativo) return;

        // Transforma a solicitação física em chamada no painel.
        simulateCall(
          solicitacao.elevadorId,
          false
        );
      } catch (erro) {
        console.error(
          "Erro ao verificar chamadas físicas:",
          erro
        );
      } finally {
        buscando = false;
      }
    }

    verificarChamadas();

    const intervalo = setInterval(
      verificarChamadas,
      3000
    );

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [
    state.elevators,
    state.activeCall,
    simulateCall,
  ]);

  // Libera microfone, alto-falante e conexões da ligação atual.
  // Se avisarElevador for true, manda o elevador encerrar também
  // (o PeerJS não avisa o outro lado ao fechar uma ligação de áudio).
  const liberarAudio = useCallback((avisarElevador = false) => {
    const controle = controlConnRef.current;
    const ligacao = mediaCallRef.current;

    controlConnRef.current = null;
    mediaCallRef.current = null;
    answeringRef.current = false;

    if (controle) {
      try {
        if (avisarElevador && controle.open) {
          controle.send({ tipo: "encerrar_chamada" });
        }
      } catch (erro) {
        console.error("Erro ao avisar o elevador:", erro);
      }

      // Pequeno atraso para a mensagem sair antes de fechar o canal.
      setTimeout(() => {
        try {
          controle.close();
        } catch {
          /* já estava fechado */
        }
      }, 300);
    }

    if (ligacao) {
      try {
        ligacao.close();
      } catch {
        /* já estava fechada */
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    setAudioStatus("idle");
  }, []);

  // Atende a chamada: liga para o Raspberry do elevador.
  const answerCall = useCallback(async () => {
    const call = state.activeCall;

    if (!call || call.status !== "waiting") {
      return;
    }

    // Chamadas de demonstração não têm áudio: mantém o comportamento antigo.
    if (call.demo) {
      dispatch({ type: "ANSWER_CALL" });
      pushToast("Chamada de demonstração atendida.", "success");
      return;
    }

    if (answeringRef.current) {
      return;
    }

    const peer = peerRef.current;

    if (!peer || !peerReady) {
      pushToast(
        "A central ainda está conectando ao serviço de chamadas.",
        "warning"
      );
      return;
    }

    if (!call.peerId) {
      pushToast(
        "Este elevador não tem Peer ID cadastrado no Back4App.",
        "error"
      );
      return;
    }

    answeringRef.current = true;
    setAudioStatus("connecting");

    let finalizado = false;
    let timeout = null;
    let aoErrarPeer = null;

    function limparEspera() {
      if (timeout) clearTimeout(timeout);
      if (aoErrarPeer) peer.off("error", aoErrarPeer);
    }

    // Falha antes de o áudio conectar: volta a chamada para "aguardando".
    function falharConexao(mensagem) {
      if (finalizado) return;
      finalizado = true;

      limparEspera();
      liberarAudio(true);
      pushToast(mensagem, "error");
    }

    try {
      // 1. Microfone do atendente (precisa de HTTPS e de permissão).
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microfone indisponível. Use o site em HTTPS."
        );
      }

      const microfone = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = microfone;

      // 2. O elevador não está com a página aberta / online.
      aoErrarPeer = (erro) => {
        if (erro.type === "peer-unavailable") {
          falharConexao(
            `${call.elevatorName} não está online. Verifique o dispositivo.`
          );
        }
      };

      peer.on("error", aoErrarPeer);

      // 3. Canal de controle (usado para encerrar a ligação).
      const controle = peer.connect(call.peerId, { reliable: true });
      controlConnRef.current = controle;

      controle.on("close", () => {
        if (controlConnRef.current === controle) {
          controlConnRef.current = null;
        }
      });

      // 4. Ligação de áudio.
      const ligacao = peer.call(call.peerId, microfone);

      if (!ligacao) {
        throw new Error("Não foi possível iniciar a ligação.");
      }

      mediaCallRef.current = ligacao;

      timeout = setTimeout(() => {
        falharConexao(
          "O elevador não respondeu a tempo. Tente atender novamente."
        );
      }, 15000);

      ligacao.on("stream", async (streamRemoto) => {
        if (finalizado || mediaCallRef.current !== ligacao) return;
        finalizado = true;

        limparEspera();

        const audio = remoteAudioRef.current;

        if (audio) {
          audio.srcObject = streamRemoto;

          try {
            await audio.play();
          } catch (erro) {
            console.error("Falha ao tocar o áudio do elevador:", erro);
          }
        }

        setAudioStatus("connected");
        dispatch({ type: "ANSWER_CALL" });
        pushToast("Chamada atendida. Áudio conectado.", "success");
      });

      // O elevador caiu no meio da ligação.
      ligacao.on("close", () => {
        if (mediaCallRef.current !== ligacao) return; // fomos nós que encerramos

        if (!finalizado) {
          falharConexao("A ligação foi encerrada pelo elevador.");
          return;
        }

        const chamada = activeCallRef.current;

        liberarAudio(false);

        if (chamada && chamada.status === "in-call") {
          dispatch({ type: "END_CALL" });
          salvarHistorico(chamada, "completed");
          pushToast("O elevador encerrou a ligação.", "info");
        }
      });

      ligacao.on("error", (erro) => {
        console.error("Erro na ligação de áudio:", erro);
        falharConexao("Erro na ligação de áudio.");
      });
    } catch (erro) {
      console.error("Erro ao atender a chamada:", erro);

      const mensagem =
        erro?.name === "NotAllowedError"
          ? "Permita o uso do microfone no navegador para atender."
          : erro?.message || "Não foi possível atender a chamada.";

      falharConexao(mensagem);
    }
  }, [
    state.activeCall,
    peerReady,
    pushToast,
    liberarAudio,
    salvarHistorico,
  ]);

  // Recusa a chamada.
  const refuseCall = useCallback(() => {
    const call = state.activeCall;

    if (!call) return;

    liberarAudio(true);

    dispatch({ type: "REFUSE_CALL" });

    salvarHistorico(call, "refused");

    pushToast("Chamada recusada.", "info");
  }, [
    state.activeCall,
    liberarAudio,
    salvarHistorico,
    pushToast,
  ]);

  // Encerra a chamada pela central.
  const endCall = useCallback(() => {
    const call = state.activeCall;

    if (!call) return;

    liberarAudio(true);

    dispatch({ type: "END_CALL" });

    salvarHistorico(call, "completed");

    pushToast("Chamada encerrada.", "info");
  }, [
    state.activeCall,
    liberarAudio,
    salvarHistorico,
    pushToast,
  ]);

  const toggleConnection = useCallback(
    (elevatorId) => {
      dispatch({
        type: "TOGGLE_CONNECTION",
        elevatorId,
      });
    },
    []
  );

  const updateSettings = useCallback(
    (settings) => {
      dispatch({
        type: "UPDATE_SETTINGS",
        settings,
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR_HISTORY" });

    pushToast(
      "Histórico limpo da tela.",
      "success"
    );
  }, [pushToast]);

  const summary = useMemo(() => {
    const elevators = state.elevators ?? [];

    return {
      totalElevators: elevators.length,
      connectedElevators: elevators.filter(
        (elevator) =>
          elevator.status === "connected"
      ).length,
      disconnectedElevators: elevators.filter(
        (elevator) =>
          elevator.status !== "connected"
      ).length,
      activeCall: state.activeCall,
      totalHistory: (state.history ?? []).length,
    };
  }, [
    state.elevators,
    state.activeCall,
    state.history,
  ]);

  const value = useMemo(
    () => ({
      ...state,
      elevators: state.elevators ?? [],
      history: state.history ?? [],
      toasts,
      audioStatus,
      peerReady,
      pushToast,
      dismissToast,
      simulateCall,
      answerCall,
      refuseCall,
      endCall,
      toggleConnection,
      updateSettings,
      clearHistory,
      summary,
      dispatch,
    }),
    [
      state,
      audioStatus,
      peerReady,
      toasts,
      pushToast,
      dismissToast,
      simulateCall,
      answerCall,
      refuseCall,
      endCall,
      toggleConnection,
      updateSettings,
      clearHistory,
      summary,
    ]
  );

  return (
    <CallCenterContext.Provider value={value}>
      {children}
    </CallCenterContext.Provider>
  );
}

export function useCallCenter() {
  const context = useContext(CallCenterContext);

  if (!context) {
    throw new Error(
      "useCallCenter deve ser utilizado dentro de CallCenterProvider."
    );
  }

  return context;
}