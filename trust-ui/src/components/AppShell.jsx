import { Outlet, useLocation } from "react-router-dom";
import { TrustBackground } from "./TrustBackground.jsx";
import { TrustHeader } from "./TrustHeader.jsx";

const AUTH_PATHS = ["/login", "/register"];

export function AppShell() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="relative min-h-screen overflow-x-hidden">
        <TrustBackground />
        <TrustHeader minimal />
        <main className="relative z-10 mx-auto max-w-lg px-4 pb-16 pt-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return <Outlet />;
}
