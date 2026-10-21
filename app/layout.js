
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import { CallCenterProvider } from "@/context/CallCenterContext";

export const metadata = {
  title: "UNICAP Conecta | Central de Chamadas",
  description:
    "Sistema de comunicação e atendimento dos elevadores do Bloco A da UNICAP.",
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