/**
 * Layout principal da aplicação (compartilhado por todas as páginas).
 * Ele monta o menu lateral, o "provedor" do estado global,
 * os avisos flutuantes e carrega o CSS.
 */

import "./globals.css";

import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import { CallCenterProvider } from "@/context/CallCenterContext";

export const metadata = {
  title: "Elevador Conectado | Painel de Chamadas",
  description:
    "Sistema de monitoramento e atendimento de chamadas dos elevadores da universidade (versão demonstrativa).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <CallCenterProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="app-content">{children}</main>
          </div>
          <Toast />
        </CallCenterProvider>
      </body>
    </html>
  );
}
