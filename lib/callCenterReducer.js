/**
 * ============================================================
 *  MÁQUINA DE ESTADOS (REDUCER) — Lógica pura, sem React
 * ============================================================
 *  Toda a regra de negócio do sistema está aqui, em funções
 *  puras: dados de entrada + ação => novo estado.
 *
 *  Isso deixa o código mais fácil de entender e de testar
 *  (veja o arquivo scripts/test-fluxos.mjs).
 * ============================================================
 */

// Importação relativa (com ".js") para que o arquivo também possa ser
// usado por scripts Node fora do Next.js, como nos nossos testes.
import { INITIAL_ELEVATORS, INITIAL_HISTORY } from "./data.js";

/** Contador usado para gerar ids únicos das chamadas. */
let callIdCounter = 100;

/**
 * Cria o estado inicial do sistema.
 * Observação: os dados são os mesmos no servidor e no navegador,
 * por isso a primeira renderização fica consistente.
 */
export function createInitialState() {
  return {
    elevators: INITIAL_ELEVATORS,
    history: INITIAL_HISTORY,
    activeCall: null,
    now: 0,
    settings: {
      operator: "Laura S.",
      room: "Sala de Atendimento — Campus Central",
    },
  };
}

/**
 * "Reduz" o estado atual a um novo estado, sempre que uma ação
 * chega. Cada tipo de ação representa uma intenção do operador.
 *
 * Regras de segurança aplicadas aqui:
 *  - só existe UMA chamada ativa por vez;
 *  - só é possível atender/recusar uma chamada que está esperando;
 *  - só é possível encerrar uma chamada em ligação;
 *  - elevadores chamando/ocupados não podem mudar de conexão.
 */
export function callCenterReducer(state, action) {
  switch (action.type) {
    case "SIMULATE_CALL": {
      const elevator = state.elevators.find((e) => e.id === action.elevatorId);
      // Regra: nada acontece se já existe uma chamada ativa.
      if (!elevator || elevator.status !== "available" || state.activeCall) {
        return state;
      }

      callIdCounter += 1;

      return {
        ...state,
        activeCall: {
          id: `chamada-${callIdCounter}`,
          elevatorId: elevator.id,
          elevatorName: elevator.name,
          block: elevator.block,
          location: elevator.location,
          createdAt: action.at,
          answeredAt: null,
          status: "waiting",
          demo: true,
        },
        elevators: state.elevators.map((e) =>
          e.id === elevator.id ? { ...e, status: "ringing" } : e
        ),
      };
    }

    case "ANSWER_CALL": {
      // Regra: só atende quem existe e está esperando.
      if (!state.activeCall || state.activeCall.status !== "waiting") {
        return state;
      }

      return {
        ...state,
        activeCall: {
          ...state.activeCall,
          status: "in-call",
          answeredAt: action.at,
        },
        elevators: state.elevators.map((e) =>
          e.id === state.activeCall.elevatorId
            ? { ...e, status: "in-call" }
            : e
        ),
      };
    }

    case "REFUSE_CALL": {
      if (!state.activeCall || state.activeCall.status !== "waiting") {
        return state;
      }

      const call = state.activeCall;

      return {
        ...state,
        activeCall: null,
        elevators: state.elevators.map((e) =>
          e.id === call.elevatorId ? { ...e, status: "available" } : e
        ),
        history: [
          {
            id: call.id,
            elevatorId: call.elevatorId,
            elevatorName: call.elevatorName,
            block: call.block,
            createdAt: call.createdAt,
            answeredAt: null,
            endedAt: action.at,
            waitSeconds: secondsBetween(call.createdAt, action.at),
            durationSeconds: 0,
            status: "refused",
            demo: true,
          },
          ...state.history,
        ],
      };
    }

    case "END_CALL": {
      if (!state.activeCall || state.activeCall.status !== "in-call") {
        return state;
      }

      const call = state.activeCall;

      return {
        ...state,
        activeCall: null,
        elevators: state.elevators.map((e) =>
          e.id === call.elevatorId ? { ...e, status: "available" } : e
        ),
        history: [
          {
            id: call.id,
            elevatorId: call.elevatorId,
            elevatorName: call.elevatorName,
            block: call.block,
            createdAt: call.createdAt,
            answeredAt: call.answeredAt,
            endedAt: action.at,
            waitSeconds: secondsBetween(call.createdAt, call.answeredAt),
            durationSeconds: secondsBetween(call.answeredAt, action.at),
            status: "completed",
            demo: true,
          },
          ...state.history,
        ],
      };
    }

    case "TOGGLE_CONNECTION": {
      const elevator = state.elevators.find((e) => e.id === action.elevatorId);
      if (
        !elevator ||
        elevator.status === "ringing" ||
        elevator.status === "in-call"
      ) {
        return state;
      }

      return {
        ...state,
        elevators: state.elevators.map((e) =>
          e.id === elevator.id
            ? { ...e, status: e.status === "offline" ? "available" : "offline" }
            : e
        ),
      };
    }

    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: { ...state.settings, ...action.patch },
      };
    }

    case "CLEAR_HISTORY": {
      return { ...state, history: [] };
    }

    case "TICK": {
      // Apenas atualiza o relógio para os cronômetros ao vivo.
      return { ...state, now: action.now };
    }

    default:
      return state;
  }
}

function secondsBetween(start, end) {
  return Math.max(0, Math.floor((end - start) / 1000));
}
