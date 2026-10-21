
export default function PageHeader({ title, description }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <p className="page-header__eyebrow">
          UNICAP / BLOCO A
        </p>

        <h1 className="page-header__title">{title}</h1>

        <p className="page-header__description">
          {description}
        </p>
      </div>

      <span className="chip chip--info">
        Demonstração
      </span>
    </header>
  );
}
