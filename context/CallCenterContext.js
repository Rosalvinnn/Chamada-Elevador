"use client";

/**
 * ============================================================
 *  CONTEXTO DO CENTRAL DE CHAMADAS
 * ============================================================
 *  Este arquivo é a "ponte" entre a lógica pura
 *  (lib/callCenterReducer.js) e a interface React.
 *
 *  Ele cuida de duas coisas:
 *   1. Guardar o estado global e aplicar as ações (dispatch);
 *   2. Mostrar avisos rápidos (toasts) de confirmação ou erro.
 *
 *  Acesse tudo nos componentes com:
 *      const { elevators, simulateCall } = useCallCenter();
 * ============================================================
 */

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import {
  callCenterReducer,
  createInitialState,
} from "@/lib/callCenterReducer";

const CallCenterContext = createContext(null);

/** Contador usado para gerar ids únicos dos avisos. */
let toastIdCounter = 0;

export function CallCenterProvider({ children }) {
  const [state, dispatch] = useReducer(
    callCenterReducer,
    undefined,
    createInitialState
  );

  // Avisos rápidos (toasts) de confirmação ou erro.
  const [toasts, setToasts] = useState([]);

  function pushToast(tone, message) {
    toastIdCounter += 1;
    const id = toastIdCounter;
    setToasts((current) => [...current, { id, tone, message }]);
    // Remove o aviso sozinho depois de 4 segundos.
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  // Cronômetro: só roda enquanto existe uma chamada ativa.
  useEffect(() => {
    if (!state.activeCall) return undefined;
    const intervalId = setInterval(
      () => dispatch({ type: "TICK", now: Date.now() }),
      1000
    );
    return () => clearInterval(intervalId);
  }, [state.activeCall]);

  // ------- Ações usadas pela interface -------

  function simulateCall(elevatorId) {
    const elevator = state.elevators.find((e) => e.id === elevatorId);

    if (!elevator || elevator.status === "offline") {
      pushToast("danger", "Elevador desconectado: não é possível chamar.");
      return;
    }
    if (state.activeCall) {
      pushToast(
        "danger",
        "Já existe uma chamada em andamento. Encerre-a antes de iniciar outra."
      );
      return;
    }

    dispatch({ type: "SIMULATE_CALL", elevatorId, at: Date.now() });
    pushToast(
      "warning",
      `Chamada de demonstração recebida do ${elevator.name}.`
    );
  }

  function answerCall() {
    if (!state.activeCall || state.activeCall.status !== "waiting") {
      pushToast("danger", "Não existe chamada aguardando atendimento.");
      return;
    }

    dispatch({ type: "ANSWER_CALL", at: Date.now() });
    pushToast("success", `Chamada do ${state.activeCall.elevatorName} atendida.`);
  }

  function refuseCall() {
    if (!state.activeCall || state.activeCall.status !== "waiting") {
      pushToast("danger", "Não existe chamada aguardando atendimento.");
      return;
    }

    const name = state.activeCall.elevatorName;
    dispatch({ type: "REFUSE_CALL", at: Date.now() });
    pushToast("neutral", `Chamada do ${name} recusada e registrada no histórico.`);
  }

  function endCall() {
    if (!state.activeCall || state.activeCall.status !== "in-call") {
      pushToast("danger", "Não existe chamada em ligação para encerrar.");
      return;
    }

    const name = state.activeCall.elevatorName;
    dispatch({ type: "END_CALL", at: Date.now() });
    pushToast("success", `Chamada com o ${name} encerrada e registrada.`);
  }

  function toggleConnection(elevatorId) {
    const elevator = state.elevators.find((e) => e.id === elevatorId);
    if (!elevator) return;

    if (elevator.status === "ringing" || elevator.status === "in-call") {
      pushToast(
        "danger",
        `Encerre a chamada do ${elevator.name} antes de mudar a conexão.`
      );
      return;
    }

    const goingOffline = elevator.status !== "offline";
    dispatch({ type: "TOGGLE_CONNECTION", elevatorId });
    pushToast(
      goingOffline ? "danger" : "success",
      goingOffline
        ? `${elevator.name} marcado como desconectado.`
        : `${elevator.name} voltou a ficar disponível.`
    );
  }

  function updateSettings(patch) {
    dispatch({ type: "UPDATE_SETTINGS", patch });
    pushToast("success", "Configurações salvas (apenas nesta demonstração).");
  }

  function clearHistory() {
    dispatch({ type: "CLEAR_HISTORY" });
    pushToast("neutral", "Histórico de demonstração limpo.");
  }

  // Valores derivados: facilitam o cálculo dos cards de resumo.
  const summary = {
    online: state.elevators.filter((e) => e.status !== "offline").length,
    total: state.elevators.length,
    waiting: state.activeCall?.status === "waiting" ? 1 : 0,
    inCall: state.activeCall?.status === "in-call" ? 1 : 0,
  };

  const value = {
    ...state,
    summary,
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
  };

  return (
    <CallCenterContext.Provider value={value}>
      {children}
    </CallCenterContext.Provider>
  );
}

/**
 * Hook usado nos componentes para acessar o estado do sistema.
 */
export function useCallCenter() {
  const context = useContext(CallCenterContext);
  if (!context) {
    throw new Error(
      "useCallCenter deve ser usado dentro de <CallCenterProvider>."
    );
  }
  return context;
}
