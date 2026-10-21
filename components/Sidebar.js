
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Visão geral", icon: "▦" },
  { href: "/elevadores", label: "Elevadores", icon: "⇅" },
  { href: "/historico", label: "Histórico", icon: "◷" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙" },
  { href: "/teste-audio", label: "Audio", icon: "" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          U
        </span>

        <div>
          <p className="sidebar__title">UNICAP Conecta</p>
          <p className="sidebar__subtitle">Central de chamadas</p>
        </div>
      </div>

      <p className="sidebar__section-label">
        Universidade Católica de Pernambuco
      </p>

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
                  <span
                    aria-hidden="true"
                    className="sidebar__icon"
                  >
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
          Sistema de comunicação dos elevadores do Bloco A.
        </p>
      </div>
    </aside>
  );
}
