import { AlertTriangle } from "lucide-react";

export function RiskWarningAlerts({ warnings = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800/60" />
        ))}
      </div>
    );
  }

  if (!warnings.length) {
    return (
      <p className="text-sm text-slate-500">No active risk warnings in this cycle.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {warnings.map((warning) => (
        <li
          key={warning}
          className="advisor-risk-alert flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <span>{warning}</span>
        </li>
      ))}
    </ul>
  );
}
