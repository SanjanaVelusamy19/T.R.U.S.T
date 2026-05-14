import { Outlet } from "react-router-dom";
import { TrustBackground } from "./TrustBackground.jsx";
import { TrustHeader } from "./TrustHeader.jsx";

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <TrustBackground />
      <TrustHeader />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
