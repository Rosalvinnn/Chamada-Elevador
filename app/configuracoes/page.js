"use client";

/**
 * Página de Configurações.
 *
 * Guarda os dados apenas em memória (demonstração): ao atualizar
 * a página, os valores voltam ao padrão. Futuramente, estas
 * preferências poderiam ser salvas em um banco de dados.
 */

import PageHeader from "@/components/PageHeader";
import { useCallCenter } from "@/context/CallCenterContext";
import { useState } from "react";

export default function ConfiguracoesPage() {
  const { settings, updateSettings, elevators } = useCallCenter();

  // Cópia local dos campos enquanto o operador digita.
  const [operator, setOperator] = useState(settings.operator);
  const [room, setRoom] = useState(settings.room);

  function handleSubmit(event) {
    event.preventDefault();
    updateSettings({ operator: operator.trim() || "Operador", room: room.trim() });
  }

  return (
    <div className="page">
      <PageHeader
        title="Configurações"
        description="Preferências do painel de atendimento (valores simulados nesta versão)."
      />

      <div className="settings-grid">
        <section className="settings-card" aria-label="Dados do atendimento">
          <h2 className="section-title">Dados do atendimento</h2>

          <form className="settings-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field__label">Nome do operador</span>
              <input
                className="field__input"
                type="text"
                value={operator}
                onChange={(event) => setOperator(event.target.value)}
                placeholder="Ex.: Laura S."
              />
            </label>

            <label className="field">
              <span className="field__label">Sala de atendimento</span>
              <input
                className="field__input"
                type="text"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                placeholder="Ex.: Sala de Atendimento — Campus Central"
              />
            </label>

            <button type="submit" className="button button--primary">
              Salvar configurações
            </button>
          </form>
        </section>

        <section className="settings-card" aria-label="Integrações futuras">
          <h2 className="section-title">Integrações futuras</h2>
          <p className="settings-card__text">
            Esta primeira versão contém apenas a interface com chamadas
            simuladas. Os itens abaixo ainda não estão implementados:
          </p>

          <ul className="settings-list">
            <li>
              <strong>Raspberry Pi por elevador:</strong> dispositivo real que
              detecta o botão físico pressionado.
            </li>
            <li>
              <strong>Sinalização pela rede:</strong> aviso automático ao
              central quando o botão é pressionado.
            </li>
            <li>
              <strong>Áudio via WebRTC:</strong> comunicação bidirecional de
              voz após o atendimento.
            </li>
          </ul>

          <p className="settings-card__text">
            Elevadores cadastrados nesta demonstração:{" "}
            <strong>{elevators.map((elevator) => elevator.name).join(", ")}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
