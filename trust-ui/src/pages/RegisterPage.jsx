import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, UserPlus } from "lucide-react";
import { GlassCard } from "../components/GlassCard.jsx";
import { LoadingSpinner } from "../components/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api, getApiErrorMessage } from "../services/api.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function onSubmit(e) {
    e.preventDefault();

    if (loading || isSubmittingRef.current) {
      console.debug("REQUEST BLOCKED (already submitting)");
      return;
    }

    console.debug("REGISTER CLICKED");
    isSubmittingRef.current = true;
    setError("");
    setLoading(true);
    console.debug("REQUEST SENT");

    try {
      const { data } = await api.post("/api/auth/register", {
        full_name: fullName,
        email: email.trim(),
        password,
      });
      if (!data?.access_token || !data?.user) {
        setError("Registration succeeded but no access token was returned.");
        return;
      }
      loginWithToken(data.access_token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setError("Please wait a moment before trying again.");
        return;
      }
      setError(
        getApiErrorMessage(err, "Registration could not be completed."),
      );
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Provision a TRUST operator
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Credentials are hashed with bcrypt; tokens are minted by the dedicated auth
          microservice and brokered exclusively via the API gateway.
        </p>
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner label="Provisioning identity and vaulting secrets…" />
        ) : (
          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            {error ? (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Full legal name
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/70"
                placeholder="Jordan Lee"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/70"
                placeholder="you@institution.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="neon-ring w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/70"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(52,211,153,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              Create TRUST profile
            </button>
          </form>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-emerald-100/90">
          <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
          <p>
            Already onboarded?{" "}
            <Link to="/login" className="font-semibold text-emerald-200 hover:text-emerald-100">
              Sign in instead
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
