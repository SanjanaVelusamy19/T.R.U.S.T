import { Link, NavLink } from "react-router-dom";
import { Building2, LayoutDashboard, LogOut, Radar, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.25)]"
      : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
  ].join(" ");

export function TrustHeader() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 shadow-[0_0_30px_rgba(34,211,238,0.45)]">
            <Shield className="h-5 w-5 text-slate-950" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
              TRUST
            </p>
            <p className="text-sm font-semibold text-white">
              Institutional Console
            </p>
          </div>
        </Link>

        {isAuthenticated ? (
          <div className="flex flex-1 items-center justify-end gap-4">
            <nav className="flex flex-wrap items-center justify-end gap-1">
              <NavLink to="/dashboard" className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Intelligence
                </span>
              </NavLink>
              <NavLink to="/loan" className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Loan Desk
                </span>
              </NavLink>
              <NavLink to="/trust" className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  <Radar className="h-4 w-4" />
                  Trust Index
                </span>
              </NavLink>
            </nav>
            <div className="hidden text-right text-xs text-slate-400 sm:block">
              <p className="font-medium text-slate-200">{user?.full_name}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500/40 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800/70 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
            >
              Open account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
