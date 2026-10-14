"use client";

/**
 * Página de Elevadores: lista completa dos elevadores e o
 * controle de conexão de cada um (simulado).
 */

import ElevatorList from "@/components/ElevatorList";
import PageHeader from "@/components/PageHeader";
import { useCallCenter } from "@/context/CallCenterContext";
import { ELEVATOR_STATUS } from "@/lib/data";
import StatusBadge from "@/components/StatusBadge";

export default function ElevadoresPage() {
  const { elevators, toggleConnection } = useCallCenter();

  return (
    <div className="page">
      <PageHeader
        title="Elevadores"
        description="Situação de cada elevador do campus e simulação de conexão dos dispositivos."
      />

      <ElevatorList title="Todos os elevadores" />

      <section aria-label="Controle de conexão dos dispositivos">
        <div className="section-header">
          <h2 className="section-title">Dispositivos (Raspberry Pi)</h2>
          <p className="section-hint">
            Nesta versão, a conexão é simulada. Futuramente, cada elevador terá
            um Raspberry Pi real enviando sinais pela rede.
          </p>
        </div>

        <div className="device-list">
          {elevators.map((elevator) => {
            const statusInfo = ELEVATOR_STATUS[elevator.status];
            const busy = elevator.status === "ringing" || elevator.status === "in-call";

            return (
              <div key={elevator.id} className="device-row">
                <div className="device-row__info">
                  <p className="device-row__name">{elevator.name}</p>
                  <p className="device-row__location">{elevator.location}</p>
                </div>

                <StatusBadge label={statusInfo.label} tone={statusInfo.tone} />

                <button
                  type="button"
                  className="button button--outline"
                  disabled={busy}
                  onClick={() => toggleConnection(elevator.id)}
                  title={
                    busy
                      ? "Encerre a chamada antes de alterar a conexão"
                      : "Simula desconectar/conectar o dispositivo"
                  }
                >
                  {elevator.status === "offline"
                    ? "Simular reconexão"
                    : "Simular desconexão"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
