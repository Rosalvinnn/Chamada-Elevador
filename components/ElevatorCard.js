"use client";

/**
 * Card de um elevador: mostra localização, status e o botão
 * adequado ao estado atual:
 *
 *  - Disponível  -> "Simular chamada"
 *  - Chamando    -> "Atender chamada"
 *  - Em ligação  -> "Encerrar ligação"
 *  - Desconectado-> botão desabilitado
 */

import StatusBadge from "@/components/StatusBadge";
import { useCallCenter } from "@/context/CallCenterContext";
import { ELEVATOR_STATUS } from "@/lib/data";

export default function ElevatorCard({ elevator }) {
  const { simulateCall, answerCall, endCall, activeCall } = useCallCenter();

  const statusInfo = ELEVATOR_STATUS[elevator.status];
  const isRinging = elevator.status === "ringing";
  const isInCall = elevator.status === "in-call";
  const isOffline = elevator.status === "offline";

  function renderAction() {
    if (isRinging) {
      return (
        <button
          type="button"
          className="button button--warning"
          onClick={answerCall}
        >
          Atender chamada
        </button>
      );
    }

    if (isInCall) {
      return (
        <button
          type="button"
          className="button button--danger"
          onClick={endCall}
        >
          Encerrar ligação
        </button>
      );
    }

    return (
      <button
        type="button"
        className="button button--outline"
        disabled={isOffline || Boolean(activeCall)}
        onClick={() => simulateCall(elevator.id)}
        title={
          isOffline
            ? "Elevador desconectado"
            : activeCall
              ? "Já existe uma chamada em andamento"
              : "Simula o pressionar do botão físico"
        }
      >
        {isOffline ? "Indisponível" : "Simular chamada"}
      </button>
    );
  }

  return (
    <article className={`elevator-card elevator-card--${elevator.status}`}>
      <div className="elevator-card__header">
        <div>
          <h3 className="elevator-card__name">{elevator.name}</h3>
          <p className="elevator-card__block">{elevator.block}</p>
        </div>
        <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />
      </div>

      <p className="elevator-card__location">{elevator.location}</p>

      <dl className="elevator-card__details">
        <div>
          <dt>Última inspeção</dt>
          <dd>{elevator.lastInspection}</dd>
        </div>
        <div>
          <dt>Nível de ruído</dt>
          <dd>{elevator.noiseLevel} dB</dd>
        </div>
      </dl>

      <div className="elevator-card__actions">{renderAction()}</div>
    </article>
  );
}
