/**
 * Cabeçalho de cada página: título, subtítulo e alguns
 * indicadores de estado do sistema (todos simulados).
 */

import { useCallCenter } from "@/context/CallCenterContext";

export default function PageHeader({ title, description }) {
  const { settings, summary } = useCallCenter();

  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        <p className="page-header__description">{description}</p>
      </div>

      <div className="page-header__meta">
        <span className="chip chip--info">
          SIP/VoIP: simulado
        </span>
        <span className="chip chip--warning">
          Canal de áudio: não disponível
        </span>
        <span className="chip chip--neutral">
          {summary.online}/{summary.total} elevadores conectados
        </span>
        <span className="chip chip--neutral">
          Operador: {settings.operator}
        </span>
      </div>
    </header>
);
}
