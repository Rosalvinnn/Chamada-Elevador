/**
 * Lista de elevadores exibida no dashboard e na página Elevadores.
 * Recebe a lista pelo contexto, então qualquer mudança de status
 * aparece automaticamente aqui.
 */

import ElevatorCard from "@/components/ElevatorCard";
import { useCallCenter } from "@/context/CallCenterContext";

export default function ElevatorList({ title = "Status dos elevadores em tempo real" }) {
  const { elevators } = useCallCenter();

  return (
    <section aria-label={title}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <p className="section-hint">Atualização automática a cada mudança de estado</p>
      </div>

      <div className="elevator-grid">
        {elevators.map((elevator) => (
          <ElevatorCard key={elevator.id} elevator={elevator} />
        ))}
      </div>
    </section>
  );
}
