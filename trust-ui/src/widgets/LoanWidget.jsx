import { Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { WidgetFrame } from "./WidgetFrame.jsx";

export function LoanWidget() {
  return (
    <WidgetFrame
      title="Loan Insights"
      subtitle="Credit & collateral desks"
      icon={Wallet}
      href="/loan"
      accent="amber"
    >
      <div className="space-y-3">
        <Link
          to="/loan"
          className="block rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-400/40"
        >
          Personal loan eligibility →
        </Link>
        <Link
          to="/gold-loan"
          className="block rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs font-medium text-amber-100 transition hover:border-amber-400/40"
        >
          Gold collateral desk →
        </Link>
      </div>
      <p className="mt-3 text-[10px] text-slate-500">
        Explainable decisions via gateway JWT routes — unchanged.
      </p>
    </WidgetFrame>
  );
}
