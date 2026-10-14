"use client";

/**
 * Painel principal de chamadas. Ele mostra uma destas três
 * situações:
 *
 *  1. Chamada recebida (esperando)  -> botões Atender / Recusar
 *  2. Chamada ativa (em ligação)    -> botão Encerrar chamada
 *  3. Nenhuma chamada               -> estado vazio + botão de teste
 *
 * A "transmissão de áudio" NÃO existe nesta versão. Sempre
 * que uma chamada é atendida, avisamos que o áudio real usará
 * WebRTC no futuro.
 */

import { useCallCenter } from "@/context/CallCenterContext";
import { formatDuration, secondsSince } from "@/lib/data";

export default function CallPanel() {
  const { activeCall, now, answerCall, refuseCall, endCall, simulateCall, elevators } =
    useCallCenter();

  // Situação 1: chamada recebida, aguardando decisão.
  if (activeCall && activeCall.status === "waiting") {
    const waitSeconds = secondsSince(activeCall.createdAt, now);

    return (
      <section className="call-panel call-panel--incoming" aria-live="assertive">
        <div className="call-panel__header">
          <h2 className="call-panel__title">
            Chamada recebida <span className="call-panel__demo">(demonstração)</span>
          </h2>
          <p className="call-panel__timer">
            Tempo em espera: <strong>{formatDuration(waitSeconds)}</strong>
          </p>
        </div>

        <div className="call-panel__body">
          <p className="call-panel__elevator">{activeCall.elevatorName}</p>
          <p className="call-panel__location">{activeCall.location}</p>
          <p className="call-panel__note">
            O áudio só começaria após o atendimento. Nesta versão, a
            transmissão ainda não está implementada.
          </p>
        </div>

        <div className="call-panel__actions">
          <button
            type="button"
            className="button button--success button--large"
            onClick={answerCall}
          >
            Atender chamada
          </button>
          <button
            type="button"
            className="button button--danger button--large"
            onClick={refuseCall}
          >
            Recusar
          </button>
        </div>
      </section>
    );
  }

  // Situação 2: chamada em andamento.
  if (activeCall && activeCall.status === "in-call") {
    const durationSeconds = secondsSince(activeCall.answeredAt, now);

    return (
      <section className="call-panel call-panel--active" aria-live="polite">
        <div className="call-panel__header">
          <h2 className="call-panel__title">
            Chamada em andamento <span className="call-panel__demo">(demonstração)</span>
          </h2>
          <p className="call-panel__timer">
            Duração: <strong>{formatDuration(durationSeconds)}</strong>
          </p>
        </div>

        <div className="call-panel__body">
          <p className="call-panel__elevator">{activeCall.elevatorName}</p>
          <p className="call-panel__location">{activeCall.location}</p>
          <p className="call-panel__note">
            Sinalização concluída com sucesso. A transmissão bidirecional de
            áudio será adicionada futuramente com WebRTC.
          </p>
        </div>

        <div className="call-panel__actions">
          <button
            type="button"
            className="button button--danger button--large"
            onClick={endCall}
          >
            Encerrar chamada
          </button>
        </div>
      </section>
    );
  }

  // Situação 3: nenhuma chamada no momento.
  const availableElevators = elevators.filter(
    (elevator) => elevator.status === "available"
  );

  return (
    <section className="call-panel call-panel--empty" aria-live="polite">
      <div className="call-panel__body">
        <p className="call-panel__elevator">Nenhuma chamada no momento</p>
        <p className="call-panel__note">
          Use o botão de teste abaixo para simular o pressionar do botão
          físico de um elevador.
        </p>
      </div>

      <div className="call-panel__actions">
        {availableElevators.map((elevator) => (
          <button
            key={elevator.id}
            type="button"
            className="button button--outline"
            onClick={() => simulateCall(elevator.id)}
          >
            Simular chamada — {elevator.name}
          </button>
        ))}
        {availableElevators.length === 0 && (
          <p className="call-panel__note">
            Nenhum elevador disponível para simulação no momento.
          </p>
        )}
      </div>
    </section>
  );
}
