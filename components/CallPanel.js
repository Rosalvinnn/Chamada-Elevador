"use client";

import { useCallCenter } from "@/context/CallCenterContext";
import { formatDuration, secondsSince } from "@/lib/data";

export default function CallPanel() {
  const {
    activeCall,
    now,
    answerCall,
    refuseCall,
    endCall,
    simulateCall,
    elevators,
    audioStatus,
    peerReady,
  } = useCallCenter();

  // Situação 1: chamada recebida, aguardando decisão.
  if (activeCall && activeCall.status === "waiting") {
    const waitSeconds = secondsSince(activeCall.createdAt, now);
    const conectando = audioStatus === "connecting";

    return (
      <section className="call-panel call-panel--incoming" aria-live="assertive">
        <div className="call-panel__header">
          <h2 className="call-panel__title">
            Chamada recebida{" "}
            {activeCall.demo && (
              <span className="call-panel__demo">(demonstração)</span>
            )}
          </h2>
          <p className="call-panel__timer">
            Tempo em espera: <strong>{formatDuration(waitSeconds)}</strong>
          </p>
        </div>

        <div className="call-panel__body">
          <p className="call-panel__elevator">{activeCall.elevatorName}</p>
          <p className="call-panel__location">{activeCall.location}</p>
          <p className="call-panel__note">
            {activeCall.demo
              ? "Chamada de demonstração: não há áudio."
              : conectando
                ? "Conectando o áudio com o elevador…"
                : peerReady
                  ? "Ao atender, o áudio com o elevador será conectado."
                  : "Conectando ao serviço de chamadas…"}
          </p>
        </div>

        <div className="call-panel__actions">
          <button
            type="button"
            className="button button--success button--large"
            onClick={answerCall}
            disabled={conectando || (!activeCall.demo && !peerReady)}
          >
            {conectando ? "Conectando…" : "Atender chamada"}
          </button>
          <button
            type="button"
            className="button button--danger button--large"
            onClick={refuseCall}
            disabled={conectando}
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
            Chamada em andamento{" "}
            {activeCall.demo && (
              <span className="call-panel__demo">(demonstração)</span>
            )}
          </h2>
          <p className="call-panel__timer">
            Duração: <strong>{formatDuration(durationSeconds)}</strong>
          </p>
        </div>

        <div className="call-panel__body">
          <p className="call-panel__elevator">{activeCall.elevatorName}</p>
          <p className="call-panel__location">{activeCall.location}</p>
          <p className="call-panel__note">
            {activeCall.demo
              ? "Chamada de demonstração: não há áudio."
              : audioStatus === "connected"
                ? "Áudio conectado. Fale com a pessoa no elevador."
                : "Áudio indisponível."}
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