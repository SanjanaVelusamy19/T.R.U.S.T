import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { GlassCard } from "../components/GlassCard.jsx";
import { LoadingSpinner } from "../components/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api, getApiErrorMessage } from "../services/api.js";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });
      if (!data?.access_token || !data?.user) {
        setError("Login succeeded but no access token was returned.");
        return;
      }
      loginWithToken(data.access_token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to authenticate."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Welcome back to TRUST
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Institutional single sign-on backed by gateway-verified JWT sessions.
        </p>
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner label="Authenticating against TRUST identity fabric…" />
        ) : (
          <form className="space-y-5" onSubmit={onSubmit}>
            {error ? (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Work email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-cyan-300/80" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/70"
                  placeholder="you@institution.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fuchsia-300/80" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/70"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.45)] transition hover:brightness-110"
            >
              Enter secure workspace
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          New to TRUST?{" "}
          <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Register your institution
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
