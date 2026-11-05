
/**
 * Lista de elevadores exibida no dashboard e na página Elevadores.
 * Agrupa automaticamente os elevadores por bloco.
 */

import ElevatorCard from "@/components/ElevatorCard";
import { useCallCenter } from "@/context/CallCenterContext";

const BLOCK_ORDER = ["A", "B", "D", "G"];

export default function ElevatorList({
  title = "Status dos elevadores em tempo real",
}) {
  const { elevators } = useCallCenter();

  // Agrupa os elevadores pelo bloco cadastrado no Back4App.
  const groupedElevators = elevators.reduce((groups, elevator) => {
    const block = String(elevator.block || "")
      .trim()
      .toUpperCase()
      .replace(/^BLOCO\s+/, "");

    const blockName = block || "SEM BLOCO";

    if (!groups[blockName]) {
      groups[blockName] = [];
    }

    groups[blockName].push(elevator);

    return groups;
  }, {});

  // Mantém a ordem dos blocos A, B, D e G.
  const sortedBlocks = Object.keys(groupedElevators).sort((a, b) => {
    const indexA = BLOCK_ORDER.indexOf(a);
    const indexB = BLOCK_ORDER.indexOf(b);

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b);
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  return (
    <section aria-label={title}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <p className="section-hint">
          Atualização automática a cada mudança de estado
        </p>
      </div>

      {sortedBlocks.map((block) => {
        const blockElevators = [...groupedElevators[block]].sort(
          (a, b) => {
            const numberA = Number(
              a.name.match(/\d+/)?.[0] || 0
            );
            const numberB = Number(
              b.name.match(/\d+/)?.[0] || 0
            );

            return numberA - numberB;
          }
        );

        return (
          <div key={block} className="elevator-block-section">
            <div className="section-header">
              <h3 className="section-title">
                {block === "SEM BLOCO"
                  ? "Elevadores sem bloco definido"
                  : `Bloco ${block}`}
              </h3>

              <p className="section-hint">
                {blockElevators.length}{" "}
                {blockElevators.length === 1
                  ? "elevador"
                  : "elevadores"}
              </p>
            </div>

            <div className="elevator-grid">
              {blockElevators.map((elevator) => (
                <ElevatorCard
                  key={elevator.id}
                  elevator={elevator}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}