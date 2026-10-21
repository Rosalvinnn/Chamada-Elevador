/**
 * ============================================================
 *  DADOS SIMULADOS DO SISTEMA
 * ============================================================
 *  Este arquivo centraliza todos os dados de demonstração:
 *  elevadores, histórico e os rótulos usados na interface.
 *
 *  No futuro, estes dados serão substituídos por informações
 *  reais enviadas pelos Raspberry Pi instalados nos elevadores.
 * ============================================================
 */

/**
 * Os três elevadores da universidade.
 *
 * Campos:
 *  - id:            identificador único (usado pelo código)
 *  - name:          nome exibido para o operador
 *  - block:         bloco onde o elevador está instalado
 *  - location:      localização mais detalhada
 *  - status:        available | ringing | in-call | offline
 *  - lastInspection: última simulação de inspeção técnica
 *  - noiseLevel:    nível de ruído simulado (dB)
 */

export const INITIAL_ELEVATORS = [
  {
    id: "elevador-01",
    name: "Elevador 1",
    block: "Bloco A",
    location: "UNICAP — Bloco A",
    status: "available",
    lastInspection: "—",
    noiseLevel: null,
  },
  {
    id: "elevador-02",
    name: "Elevador 2",
    block: "Bloco A",
    location: "UNICAP — Bloco A",
    status: "available",
    lastInspection: "—",
    noiseLevel: null,
  },
  {
    id: "elevador-03",
    name: "Elevador 3",
    block: "Bloco A",
    location: "UNICAP — Bloco A",
    status: "available",
    lastInspection: "—",
    noiseLevel: null,
  },
  {
    id: "elevador-04",
    name: "Elevador 4",
    block: "Bloco A",
    location: "UNICAP — Bloco A",
    status: "available",
    lastInspection: "—",
    noiseLevel: null,
  },
];


/**
 * Histórico inicial com chamadas já "finalizadas".
 * As datas são fixas para que a primeira renderização seja
 * idêntica no servidor e no navegador (evita erro de hidratação).
 */
export const INITIAL_HISTORY = [
  {
    id: "chamada-004",
    elevatorId: "elevador-02",
    elevatorName: "Elevador 02",
    block: "Bloco B",
    createdAt: new Date(2026, 9, 24, 14, 32, 10).getTime(),
    answeredAt: new Date(2026, 9, 24, 14, 34, 56).getTime(),
    endedAt: new Date(2026, 9, 24, 14, 34, 56).getTime(),
    waitSeconds: 166,
    durationSeconds: 0,
    status: "refused",
    demo: true,
  },
  {
    id: "chamada-003",
    elevatorId: "elevador-03",
    elevatorName: "Elevador 03",
    block: "Bloco C",
    createdAt: new Date(2026, 9, 24, 14, 20, 3).getTime(),
    answeredAt: new Date(2026, 9, 24, 14, 21, 5).getTime(),
    endedAt: new Date(2026, 9, 24, 14, 22, 47).getTime(),
    waitSeconds: 62,
    durationSeconds: 102,
    status: "completed",
    demo: true,
  },
  {
    id: "chamada-002",
    elevatorId: "elevador-01",
    elevatorName: "Elevador 01",
    block: "Bloco A",
    createdAt: new Date(2026, 9, 24, 11, 15, 40).getTime(),
    answeredAt: null,
    endedAt: new Date(2026, 9, 24, 11, 15, 40).getTime(),
    waitSeconds: 45,
    durationSeconds: 0,
    status: "refused",
    demo: true,
  },
  {
    id: "chamada-001",
    elevatorId: "elevador-03",
    elevatorName: "Elevador 03",
    block: "Bloco C",
    createdAt: new Date(2026, 9, 23, 19, 24, 5).getTime(),
    answeredAt: new Date(2026, 9, 23, 19, 25, 0).getTime(),
    endedAt: new Date(2026, 9, 23, 19, 28, 10).getTime(),
    waitSeconds: 55,
    durationSeconds: 190,
    status: "completed",
    demo: true,
  },
];

/**
 * Rótulos e cores usados na interface para cada estado.
 */
export const ELEVATOR_STATUS = {
  available: { label: "Disponível", tone: "success" },
  ringing: { label: "Chamando", tone: "warning" },
  "in-call": { label: "Em ligação", tone: "info" },
  offline: { label: "Desconectado", tone: "neutral" },
};

export const CALL_STATUS = {
  waiting: { label: "Aguardando atendimento", tone: "warning" },
  "in-call": { label: "Em ligação", tone: "info" },
  refused: { label: "Recusada", tone: "danger" },
  completed: { label: "Concluída", tone: "success" },
};

/**
 * Converte segundos em "mm:ss" (ex.: 102 => "01:42").
 */
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

/**
 * Converte um timestamp em data legível (ex.: "24/10/2026").
 */
export function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

/**
 * Converte um timestamp em horário legível (ex.: "14:32:10").
 */
export function formatTime(timestamp) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

/**
 * Calcula quantos segundos se passaram entre um momento e "agora".
 */
export function secondsSince(timestamp, now) {
  if (!timestamp || !now) return 0;
  return Math.max(0, Math.floor((now - timestamp) / 1000));
}
