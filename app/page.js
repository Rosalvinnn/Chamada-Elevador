"use client";

/**
 * Dashboard: visão geral do sistema.
 *
 * Ordem das seções:
 *  1. Cards de resumo (elevadores online, espera, andamento)
 *  2. Painel de chamada (recebida, ativa ou estado vazio)
 *  3. Lista de elevadores com seus estados
 *  4. Histórico recente de chamadas
 */

import CallPanel from "@/components/CallPanel";
import ElevatorList from "@/components/ElevatorList";
import HistoryTable from "@/components/HistoryTable";
import PageHeader from "@/components/PageHeader";
import SummaryCards from "@/components/SummaryCards";

export default function DashboardPage() {
  return (
    <div className="page">
      <PageHeader
        title="Painel de Chamadas"
        description="Monitoramento das comunicações interativas e atendimento em tempo real (chamadas simuladas)."
      />

      <SummaryCards />

      <CallPanel />

      <ElevatorList />

      <section aria-label="Histórico recente de chamadas">
        <div className="section-header">
          <h2 className="section-title">Histórico recente de chamadas</h2>
          <p className="section-hint">Últimas 5 chamadas simuladas</p>
        </div>
        <HistoryTable limit={5} />
      </section>
    </div>
  );
}
