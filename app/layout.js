import "./globals.css";

import AppShell from "@/components/AppShell";

export const metadata = {
  title: "UNICAP Conecta | Central de Chamadas",
  description:
    "Sistema de comunicação e atendimento dos elevadores do Bloco A da UNICAP.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

