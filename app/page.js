"use client";

import CallPanel from "@/components/CallPanel";
import ElevatorList from "@/components/ElevatorList";
import PageHeader from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <div className="page dashboard-page">
      <PageHeader
        title="Central de chamadas"
        description="Comunicação de apoio dos elevadores da UNICAP."
      />

      <CallPanel />

      <ElevatorList title="Elevadores Unicap" />
    </div>
  );
}