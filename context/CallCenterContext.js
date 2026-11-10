
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
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
          console.error("Erro ao carregar elevadores:", dados);
          return;
        }

        const lista = (dados.elevadores ?? []).map((elevador) => ({
          id: elevador.objectId,
          name: `Elevador ${elevador.numero}`,
          block: elevador.bloco,
          location: `Bloco ${elevador.bloco}`,
          status: "available",
          lastInspection: "—",
          noiseLevel: 0,
        }));

        if (ativo) {
          dispatch({
            type: "SYNC_ELEVATORS",
            elevators: lista,
          });
        }
      } catch (erro) {
        console.error("Erro ao carregar elevadores:", erro);
      }
    }

    carregarElevadores();

    const intervalo = setInterval(carregarElevadores, 15000);

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
          console.error("Erro ao carregar histórico:", dados);
          return;
        }

        if (ativo) {
          dispatch({
            type: "SYNC_HISTORY",
            history: dados.historico,
          });
        }
      } catch (erro) {
        console.error("Erro ao consultar histórico:", erro);
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

  // Salva uma chamada finalizada no Back4App.
  const salvarHistorico = useCallback(async (call, status) => {
    console.log("TENTANDO SALVAR:", call, status);

    const endedAt = Date.now();

    const waitSeconds = call.answeredAt
      ? Math.max(
          0,
          Math.floor((call.answeredAt - call.createdAt) / 1000)
        )
      : Math.max(
          0,
          Math.floor((endedAt - call.createdAt) / 1000)
        );

    const durationSeconds = call.answeredAt
      ? Math.max(
          0,
          Math.floor((endedAt - call.answeredAt) / 1000)
        )
      : 0;

    const registro = {
      elevatorId: call.elevatorId,
      elevatorName: call.elevatorName,
      block: call.block,
      origin: `${call.elevatorName} — ${call.block || "Bloco não informado"}`,
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
        console.error("Não foi possível salvar a chamada:", dados);

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
      console.error("Erro ao enviar histórico:", erro);

      pushToast(
        "Erro de conexão ao salvar o histórico.",
        "error"
      );

      return false;
    }
  }, [pushToast]);

  const simulateCall = useCallback(
    (elevatorId) => {
      const elevator = state.elevators.find(
        (item) => item.id === elevatorId
      );

      if (!elevator) {
        pushToast("Elevador não encontrado.", "error");
        return;
      }

      if (state.activeCall) {
        pushToast("Já existe uma chamada em andamento.", "warning");
        return;
      }

      dispatch({
        type: "SIMULATE_CALL",
        elevatorId,
      });

      pushToast(`Chamada iniciada: ${elevator.name}.`, "success");
    },
    [state.elevators, state.activeCall, pushToast]
  );

  // Consulta chamadas físicas pendentes automaticamente.
  useEffect(() => {
    if (state.activeCall || !state.elevators.length) {
      return;
    }

    let ativo = true;
    let buscando = false;

    async function verificarChamadas() {
      if (buscando) return;

      buscando = true;

      try {
        const resposta = await fetch("/api/chamadas/pendentes", {
          cache: "no-store",
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
          console.error("Erro ao consultar chamadas pendentes:", dados);
          return;
        }

        if (!ativo || !dados.solicitacoes?.length) {
          return;
        }

        const solicitacao = dados.solicitacoes.find((item) =>
          state.elevators.some(
            (elevador) => elevador.id === item.elevadorId
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

        const confirmacao = await respostaConfirmacao.json();

        if (!respostaConfirmacao.ok || !confirmacao.sucesso) {
          console.error("Erro ao confirmar solicitação:", confirmacao);
          return;
        }

        if (!ativo) return;

        // Transforma a solicitação física em chamada no painel.
        simulateCall(solicitacao.elevadorId);
      } catch (erro) {
        console.error("Erro ao verificar chamadas físicas:", erro);
      } finally {
        buscando = false;
      }
    }

    verificarChamadas();

    const intervalo = setInterval(verificarChamadas, 3000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [state.elevators, state.activeCall, simulateCall]);

  const answerCall = useCallback(() => {
    if (!state.activeCall || state.activeCall.status !== "waiting") {
      return;
    }

    dispatch({ type: "ANSWER_CALL" });
    pushToast("Chamada atendida.", "success");
  }, [state.activeCall, pushToast]);

  const refuseCall = useCallback(() => {
    const call = state.activeCall;

    if (!call) return;

    dispatch({ type: "REFUSE_CALL" });

    salvarHistorico(call, "refused");

    pushToast("Chamada recusada.", "info");
  }, [state.activeCall, salvarHistorico, pushToast]);

  const endCall = useCallback(() => {
    const call = state.activeCall;

    if (!call) return;

    dispatch({ type: "END_CALL" });

    salvarHistorico(call, "completed");

    pushToast("Chamada encerrada.", "info");
  }, [state.activeCall, salvarHistorico, pushToast]);

  const toggleConnection = useCallback((elevatorId) => {
    dispatch({
      type: "TOGGLE_CONNECTION",
      elevatorId,
    });
  }, []);

  const updateSettings = useCallback((settings) => {
    dispatch({
      type: "UPDATE_SETTINGS",
      settings,
    });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR_HISTORY" });
    pushToast("Histórico limpo da tela.", "success");
  }, [pushToast]);

  const summary = useMemo(() => {
    const elevators = state.elevators ?? [];

    return {
      totalElevators: elevators.length,
      connectedElevators: elevators.filter(
        (elevator) => elevator.status === "connected"
      ).length,
      disconnectedElevators: elevators.filter(
        (elevator) => elevator.status !== "connected"
      ).length,
      activeCall: state.activeCall,
      totalHistory: (state.history ?? []).length,
    };
  }, [state.elevators, state.activeCall, state.history]);

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