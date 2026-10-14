/**
 * ============================================================
 *  TESTE DOS FLUXOS PRINCIPAIS (sem bibliotecas extras)
 * ============================================================
 *  Execute com:  npm test
 *
 *  O teste importa a "máquina de estados" pura
 *  (lib/callCenterReducer.js) e verifica se as regras de
 *  negócio funcionam como esperado.
 * ============================================================
 */

import assert from "node:assert/strict";
import {
  callCenterReducer,
  createInitialState,
} from "../lib/callCenterReducer.js";

let testsPassed = 0;

/** Roda um teste e mostra o resultado no terminal. */
function test(name, fn) {
  try {
    fn();
    testsPassed += 1;
    console.log(`  ✔ ${name}`);
  } catch (error) {
    console.error(`  ✘ ${name}`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

console.log("\nElevador Conectado — testes dos fluxos de chamada\n");

const T0 = Date.parse("2026-10-24T14:30:00");

// ------------------------------------------------------------------
test("estado inicial: 3 elevadores disponíveis e nenhuma chamada", () => {
  const state = createInitialState();

  assert.equal(state.elevators.length, 3);
  assert.ok(state.elevators.every((e) => e.status === "available"));
  assert.equal(state.activeCall, null);
  assert.ok(state.history.length > 0, "o histórico começa com chamadas de exemplo");
});

// ------------------------------------------------------------------
test("simular chamada: elevador fica 'Chamando' e a chamada entra em espera", () => {
  const state = callCenterReducer(createInitialState(), {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-01",
    at: T0,
  });

  assert.equal(state.activeCall.status, "waiting");
  assert.equal(state.activeCall.elevatorId, "elevador-01");
  assert.equal(state.activeCall.demo, true, "a chamada deve ser marcada como demonstração");

  const elevator = state.elevators.find((e) => e.id === "elevador-01");
  assert.equal(elevator.status, "ringing");
});

// ------------------------------------------------------------------
test("não é possível iniciar duas chamadas ao mesmo tempo", () => {
  let state = callCenterReducer(createInitialState(), {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-01",
    at: T0,
  });

  const before = state;
  state = callCenterReducer(state, {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-02",
    at: T0 + 1000,
  });

  assert.equal(state, before, "a segunda chamada deve ser ignorada");
  assert.equal(state.activeCall.elevatorId, "elevador-01");
});

// ------------------------------------------------------------------
test("atender chamada: elevador passa a 'Em ligação'", () => {
  let state = callCenterReducer(createInitialState(), {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-02",
    at: T0,
  });

  state = callCenterReducer(state, {
    type: "ANSWER_CALL",
    at: T0 + 30_000,
  });

  assert.equal(state.activeCall.status, "in-call");
  assert.equal(state.activeCall.answeredAt, T0 + 30_000);

  const elevator = state.elevators.find((e) => e.id === "elevador-02");
  assert.equal(elevator.status, "in-call");
});

// ------------------------------------------------------------------
test("encerrar chamada ativa: registra duração no histórico", () => {
  let state = callCenterReducer(createInitialState(), {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-03",
    at: T0,
  });
  state = callCenterReducer(state, { type: "ANSWER_CALL", at: T0 + 60_000 });
  const historySize = state.history.length;
  state = callCenterReducer(state, { type: "END_CALL", at: T0 + 150_000 });

  assert.equal(state.activeCall, null);
  assert.equal(state.history.length, historySize + 1);

  const last = state.history[0];
  assert.equal(last.status, "completed");
  assert.equal(last.waitSeconds, 60, "tempo de espera = atendimento - chamada");
  assert.equal(last.durationSeconds, 90, "duração = encerramento - atendimento");

  const elevator = state.elevators.find((e) => e.id === "elevador-03");
  assert.equal(elevator.status, "available", "elevador volta a ficar disponível");
});

// ------------------------------------------------------------------
test("recusar chamada: registrada no histórico com status 'refused'", () => {
  let state = callCenterReducer(createInitialState(), {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-01",
    at: T0,
  });
  state = callCenterReducer(state, { type: "REFUSE_CALL", at: T0 + 45_000 });

  assert.equal(state.activeCall, null);
  assert.equal(state.history[0].status, "refused");
  assert.equal(state.history[0].durationSeconds, 0);
  assert.equal(state.history[0].waitSeconds, 45);
});

// ------------------------------------------------------------------
test("não é possível atender sem uma chamada existente", () => {
  const state = createInitialState();
  const after = callCenterReducer(state, { type: "ANSWER_CALL", at: T0 });

  assert.equal(after, state, "nada deve mudar");
});

// ------------------------------------------------------------------
test("não é possível encerrar uma chamada que não está em ligação", () => {
  let state = callCenterReducer(createInitialState(), {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-01",
    at: T0,
  });

  const before = state;
  state = callCenterReducer(state, { type: "END_CALL", at: T0 + 10_000 });

  assert.equal(state, before, "a chamada continua em espera");
  assert.equal(state.activeCall.status, "waiting");
});

// ------------------------------------------------------------------
test("elevador desconectado não aceita chamadas", () => {
  let state = callCenterReducer(createInitialState(), {
    type: "TOGGLE_CONNECTION",
    elevatorId: "elevador-01",
  });
  assert.equal(
    state.elevators.find((e) => e.id === "elevador-01").status,
    "offline"
  );

  const before = state;
  state = callCenterReducer(state, {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-01",
    at: T0,
  });

  assert.equal(state, before, "a chamada deve ser ignorada");
});

// ------------------------------------------------------------------
test("não é possível desconectar um elevador enquanto ele chama", () => {
  let state = callCenterReducer(createInitialState(), {
    type: "SIMULATE_CALL",
    elevatorId: "elevador-02",
    at: T0,
  });

  const before = state;
  state = callCenterReducer(state, {
    type: "TOGGLE_CONNECTION",
    elevatorId: "elevador-02",
  });

  assert.equal(state, before);
});

// ------------------------------------------------------------------
test("limpar histórico deixa a lista vazia", () => {
  const state = callCenterReducer(createInitialState(), {
    type: "CLEAR_HISTORY",
  });
  assert.deepEqual(state.history, []);
});

// ------------------------------------------------------------------
test("cronômetro (TICK) apenas atualiza o relógio", () => {
  const state = callCenterReducer(createInitialState(), {
    type: "TICK",
    now: T0,
  });
  assert.equal(state.now, T0);
});

// ------------------------------------------------------------------
console.log(`\n${testsPassed} teste(s) passaram.${process.exitCode ? " Houve falhas!" : " Tudo certo!\n"}`);
