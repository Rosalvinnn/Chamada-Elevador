"use client";

/**
 * Menu lateral escuro com a navegação principal.
 * O item ativo é destacado de acordo com a página atual.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/elevadores", label: "Elevadores", icon: "⇅" },
  { href: "/historico", label: "Histórico de Chamadas", icon: "🕘" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          ⇅
        </span>
        <div>
          <p className="sidebar__title">Elevador Conectado</p>
          <p className="sidebar__subtitle">Campus Central — Sorocaba</p>
        </div>
      </div>

      <p className="sidebar__section-label">Monitoramento Operacional</p>

      <nav aria-label="Navegação principal">
        <ul className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar__link ${
                    isActive ? "sidebar__link--active" : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span aria-hidden="true" className="sidebar__icon">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <p className="sidebar__demo-tag">Modo demonstração</p>
        <p className="sidebar__footer-text">
          Chamadas simuladas — sem áudio real.
        </p>
      </div>
    </aside>
  );
}
