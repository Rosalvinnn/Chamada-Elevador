/**
 * Três cards de resumo mostrados no topo do dashboard:
 * elevadores online, chamadas em espera e chamadas em andamento.
 */

import { useCallCenter } from "@/context/CallCenterContext";

export default function SummaryCards() {
  const { summary, elevators } = useCallCenter();

  const offlineNames = elevators
    .filter((elevator) => elevator.status === "offline")
    .map((elevator) => elevator.name);

  const cards = [
    {
      key: "online",
      label: "Elevadores online",
      value: `${summary.online}/${summary.total}`,
      hint:
        summary.online === summary.total
          ? "Todos os elevadores conectados"
          : `Desconectados: ${offlineNames.join(", ")}`,
      tone: summary.online === summary.total ? "success" : "warning",
      icon: "🛗",
    },
    {
      key: "waiting",
      label: "Chamadas em espera",
      value: String(summary.waiting).padStart(2, "0"),
      hint:
        summary.waiting > 0
          ? "Aguardando atendimento do operador"
          : "Nenhuma chamada na fila",
      tone: summary.waiting > 0 ? "warning" : "neutral",
      icon: "🔔",
    },
    {
      key: "in-call",
      label: "Chamadas em andamento",
      value: String(summary.inCall).padStart(2, "0"),
      hint:
        summary.inCall > 0
          ? "Operador em comunicação com o elevador"
          : "Nenhuma ligação ativa",
      tone: summary.inCall > 0 ? "info" : "neutral",
      icon: "🎧",
    },
  ];

  return (
    <section className="summary-grid" aria-label="Resumo do sistema">
      {cards.map((card) => (
        <article key={card.key} className={`summary-card summary-card--${card.tone}`}>
          <div className="summary-card__top">
            <p className="summary-card__label">{card.label}</p>
            <span className="summary-card__icon" aria-hidden="true">
              {card.icon}
            </span>
          </div>
          <p className="summary-card__value">{card.value}</p>
          <p className="summary-card__hint">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
