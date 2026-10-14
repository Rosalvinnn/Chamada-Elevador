"use client";

/**
 * Página de Histórico: todas as chamadas registradas,
 * com a possibilidade de limpar a lista (para demonstrar
 * o estado vazio da interface).
 */

import HistoryTable from "@/components/HistoryTable";
import PageHeader from "@/components/PageHeader";
import { useCallCenter } from "@/context/CallCenterContext";

export default function HistoricoPage() {
  const { history, clearHistory } = useCallCenter();

  return (
    <div className="page">
      <PageHeader
        title="Histórico de Chamadas"
        description="Registro de todas as chamadas simuladas: elevador, data, horário, duração e resultado."
      />

      <section aria-label="Registro completo de chamadas">
        <div className="section-header">
          <h2 className="section-title">Registro de chamadas</h2>
          <div className="section-header__actions">
            <p className="section-hint">
              {history.length} chamada(s) registrada(s)
            </p>
            <button
              type="button"
              className="button button--outline"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              Limpar histórico
            </button>
          </div>
        </div>

        <HistoryTable />
      </section>
    </div>
  );
}
