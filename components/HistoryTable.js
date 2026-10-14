"use client";

/**
 * Tabela com o histórico de chamadas.
 * Cada chamada simulada aparece aqui ao ser recusada ou encerrada.
 *
 * A propriedade "limit" é opcional: no dashboard mostramos apenas
 * as 5 chamadas mais recentes.
 */

import { useCallCenter } from "@/context/CallCenterContext";
import {
  CALL_STATUS,
  formatDate,
  formatDuration,
  formatTime,
} from "@/lib/data";
import StatusBadge from "@/components/StatusBadge";

export default function HistoryTable({ limit }) {
  const { history } = useCallCenter();

  const rows = typeof limit === "number" ? history.slice(0, limit) : history;

  // Estado vazio: ainda não houve chamadas registradas.
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__icon" aria-hidden="true">
          🕘
        </p>
        <p className="empty-state__title">Nenhuma chamada registrada</p>
        <p className="empty-state__text">
          Assim que você simular e finalizar uma chamada, ela aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="history-table">
        <caption className="sr-only">
          Histórico de chamadas simuladas do Elevador Conectado
        </caption>
        <thead>
          <tr>
            <th scope="col">Elevador</th>
            <th scope="col">Data</th>
            <th scope="col">Horário</th>
            <th scope="col">Espera</th>
            <th scope="col">Duração</th>
            <th scope="col">Status</th>
            <th scope="col">Origem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((call) => {
            const statusInfo = CALL_STATUS[call.status];

            return (
              <tr key={call.id}>
                <th scope="row" className="history-table__elevator">
                  {call.elevatorName}
                  <span className="history-table__block">{call.block}</span>
                </th>
                <td>{formatDate(call.createdAt)}</td>
                <td>{formatTime(call.createdAt)}</td>
                <td>{formatDuration(call.waitSeconds)}</td>
                <td>{call.durationSeconds > 0 ? formatDuration(call.durationSeconds) : "—"}</td>
                <td>
                  <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
                </td>
                <td>
                  <span className="tag-demo">Demonstração</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
