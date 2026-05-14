import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, Gauge, ShieldCheck } from "lucide-react";
import { GlassCard } from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
            Command overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Good day, {user?.full_name?.split(" ")[0] || "operator"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            TRUST routes every client call through the hardened API gateway with JWT
            verification, centralized logging, and adaptive rate limits aligned to
            institutional risk controls.
          </p>
        </div>
        <Link
          to="/loan"
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-slate-900/70 px-4 py-2 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-500/40 hover:bg-slate-900"
        >
          Launch loan desk
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Identity plane
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Auth microservice</p>
              <p className="mt-1 text-xs text-slate-400">
                bcrypt-hashed credentials, JWT issuance, introspection endpoint.
              </p>
            </div>
            <ShieldCheck className="h-9 w-9 text-cyan-300" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Credit surface
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Loan engine</p>
              <p className="mt-1 text-xs text-slate-400">
                Deterministic policy checks with explainable declines and offers.
              </p>
            </div>
            <Gauge className="h-9 w-9 text-fuchsia-300" />
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Edge control
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Gateway policies</p>
              <p className="mt-1 text-xs text-slate-400">
                SlowAPI throttles, structured request logs, uniform error envelopes.
              </p>
            </div>
            <Activity className="h-9 w-9 text-emerald-300" />
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-white">Active session</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Operator</dt>
            <dd className="mt-1 font-medium text-slate-100">{user?.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 font-mono text-xs text-cyan-100">{user?.email}</dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  );
}
