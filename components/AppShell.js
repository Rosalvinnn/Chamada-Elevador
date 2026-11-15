"use client";

import { usePathname } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import { CallCenterProvider } from "@/context/CallCenterContext";

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/dispositivo")) {
    return <>{children}</>;
  }

  return (
    <CallCenterProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
      <Toast />
    </CallCenterProvider>
  );
}