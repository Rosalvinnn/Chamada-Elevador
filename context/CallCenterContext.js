
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
  const connectionRef = useRef(null);
  const [peerReady, setPeerReady] = useState(false);

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

  // Inicializa a conexão PeerJS da central.
  useEffect(() => {
    let ativo = true;

    async function iniciarPeer() {
      try {
        const { default: Peer } = await import("peerjs");

        if (!ativo) return;

        // ID fixo para a Raspberry encontrar a central.
        const peer = new Peer("unicap-central-atendimento", {
          debug: 2,
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
          if (!ativo) return;

          console.log("Central PeerJS conectada:", id);
          setPeerReady(true);
        });

        // Recebe a conexão iniciada pela Raspberry.
        peer.on("connection", (connection) => {
          console.log(
            "Raspberry iniciou uma conexão:",
            connection.peer
          );

          if (connectionRef.current) {
            connectionRef.current.close();
          }

          connectionRef.current = connection;

          connection.on("open", () => {
            console.log(
              "Conexão com a Raspberry estabelecida!"
            );

            pushToast(
              "Conexão recebida do elevador.",
              "success"
            );
          });

          connection.on("data", (dados) => {
            console.log(
              "Mensagem recebida da Raspberry:",
              dados
            );
          });

          connection.on("close", () => {
            console.log("Raspberry encerrou a conexão.");

            if (connectionRef.current === connection) {
              connectionRef.current = null;
            }
          });

          connection.on("error", (erro) => {
            console.error(
              "Erro na conexão com a Raspberry:",
              erro
            );
          });
        });

        peer.on("error", (erro) => {
          console.error("Erro PeerJS da central:", erro);
          setPeerReady(false);
        });

        peer.on("disconnected", () => {
          setPeerReady(false);
          console.log(
            "Central desconectada do servidor PeerJS."
          );
        });

        peer.on("close", () => {
          setPeerReady(false);
          console.log(
            "Conexão PeerJS da central encerrada."
          );
        });
      } catch (erro) {
        console.error(
          "Erro ao iniciar PeerJS:",
          erro
        );
      }
    }

    iniciarPeer();

    return () => {
      ativo = false;

      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }

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

  // Atende a chamada iniciada pela Raspberry.
  const answerCall = useCallback(() => {
    const call = state.activeCall;

    if (!call || call.status !== "waiting") {
      return;
    }

    if (!peerRef.current || !peerReady) {
      pushToast(
        "A central ainda está conectando ao serviço de chamadas.",
        "warning"
      );
      return;
    }

    const connection = connectionRef.current;

    if (!connection || !connection.open) {
      pushToast(
        "Aguardando a conexão da Raspberry. Tente novamente em instantes.",
        "warning"
      );
      return;
    }

    console.log(
      "Aceitando chamada do elevador:",
      call.elevatorName
    );

    connection.send({
      tipo: "central_aceitou",
      elevador: call.elevatorName,
    });

    dispatch({ type: "ANSWER_CALL" });

    pushToast(
      "Chamada atendida. Conexão estabelecida.",
      "success"
    );
  }, [
    state.activeCall,
    peerReady,
    pushToast,
  ]);

  // Recusa a chamada.
  const refuseCall = useCallback(() => {
    const call = state.activeCall;

    if (!call) return;

    if (connectionRef.current) {
      if (connectionRef.current.open) {
        connectionRef.current.send({
          tipo: "central_recusou",
        });
      }

      connectionRef.current.close();
      connectionRef.current = null;
    }

    dispatch({ type: "REFUSE_CALL" });

    salvarHistorico(call, "refused");

    pushToast("Chamada recusada.", "info");
  }, [
    state.activeCall,
    salvarHistorico,
    pushToast,
  ]);

  // Encerra a chamada pela central.
  const endCall = useCallback(() => {
    const call = state.activeCall;

    if (!call) return;

    if (connectionRef.current) {
      if (connectionRef.current.open) {
        connectionRef.current.send({
          tipo: "encerrar_chamada",
        });
      }

      connectionRef.current.close();
      connectionRef.current = null;
    }

    dispatch({ type: "END_CALL" });

    salvarHistorico(call, "completed");

    pushToast("Chamada encerrada.", "info");
  }, [
    state.activeCall,
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