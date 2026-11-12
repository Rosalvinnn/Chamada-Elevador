
import { INITIAL_HISTORY } from "./data.js";

let callIdCounter = 100;

export function createInitialState() {
  return {
    elevators: [],
    history: INITIAL_HISTORY,
    activeCall: null,
    now: Date.now(),
    settings: {
      operator: "Laura S.",
      room: "Sala de Atendimento — Campus Central",
    },
  };
}

export function callCenterReducer(state, action) {
  switch (action.type) {

    case "UPDATE_HISTORY_ID": {
      return {
        ...state,
        history: state.history.map((call) =>
          call.id === action.temporaryId
            ? { ...call, id: action.newId }
            : call
        ),
      };
    }
    
    case "SYNC_HISTORY": {
      return {
        ...state,
        history: Array.isArray(action.history)
          ? action.history
          : [],
      };
    }

    case "SYNC_ELEVATORS": {
      const recebidos = Array.isArray(action.elevators)
        ? action.elevators
        : [];

      const elevators = recebidos.map((novo) => {
        const existente = state.elevators.find(
          (item) => item.id === novo.id
        );

        return {
          ...novo,
          status: existente?.status ?? novo.status ?? "available",
        };
      });

      return { ...state, elevators };
    }

    case "SIMULATE_CALL": {
      if (state.activeCall) return state;

      const elevator = state.elevators.find(
        (item) => item.id === action.elevatorId
      );

      if (!elevator) return state;

      const createdAt = Date.now();

      const call = {
        id: `call-${++callIdCounter}`,
        elevatorId: elevator.id,
        peerId: elevator.peerId || null,
        elevatorName: elevator.name,
        block: elevator.block,
        location: elevator.location,
        status: "waiting",
        createdAt,
        answeredAt: null,
        endedAt: null,
        waitSeconds: 0,
        durationSeconds: 0,
        demo: true,
      };

      return {
        ...state,
        now: createdAt,
        activeCall: call,
      };
    }

    case "ANSWER_CALL": {
      if (
        !state.activeCall ||
        state.activeCall.status !== "waiting"
      ) {
        return state;
      }

      const answeredAt = Date.now();

      return {
        ...state,
        now: answeredAt,
        activeCall: {
          ...state.activeCall,
          status: "in-call",
          answeredAt,
          waitSeconds: Math.max(
            0,
            Math.floor(
              (answeredAt - state.activeCall.createdAt) / 1000
            )
          ),
        },
      };
    }

    case "REFUSE_CALL": {
      if (!state.activeCall) return state;

      const endedAt = Date.now();

      const callRecusada = {
        ...state.activeCall,
        status: "refused",
        endedAt,
        waitSeconds: Math.max(
          0,
          Math.floor(
            (endedAt - state.activeCall.createdAt) / 1000
          )
        ),
        durationSeconds: 0,
      };

      return {
        ...state,
        now: endedAt,
        activeCall: null,
        history: [callRecusada, ...state.history],
      };
    }

    case "END_CALL": {
      if (!state.activeCall) return state;

      const endedAt = Date.now();
      const call = state.activeCall;

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

      const callEncerrada = {
        ...call,
        status: "completed",
        endedAt,
        waitSeconds,
        durationSeconds,
      };

      return {
        ...state,
        now: endedAt,
        activeCall: null,
        history: [callEncerrada, ...state.history],
      };
    }

    case "TOGGLE_CONNECTION": {
      return {
        ...state,
        elevators: state.elevators.map((elevator) => {
          if (elevator.id !== action.elevatorId) {
            return elevator;
          }

          return {
            ...elevator,
            status:
              elevator.status === "connected"
                ? "available"
                : "connected",
          };
        }),
      };
    }

    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
      };
    }

    case "CLEAR_HISTORY": {
      return {
        ...state,
        history: [],
      };
    }

    case "TICK": {
      return {
        ...state,
        now: Date.now(),
      };
    }

    default:
      return state;
  }
}