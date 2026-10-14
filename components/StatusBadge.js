/**
 * Etiqueta colorida usada para mostrar o status de uma
 * chamada ou de um elevador (ex.: "Disponível", "Chamando").
 */

const TONES = {
  success: "badge--success",
  warning: "badge--warning",
  info: "badge--info",
  danger: "badge--danger",
  neutral: "badge--neutral",
};

export default function StatusBadge({ label, tone = "neutral" }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.neutral}`}>
      <span className="badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
