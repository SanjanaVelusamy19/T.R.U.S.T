import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingSpinner } from "../components/LoadingSpinner.jsx";

export function WidgetFrame({
  title,
  subtitle,
  icon: Icon,
  loading = false,
  error = "",
  href,
  className = "",
  span = "",
  accent = "cyan",
  children,
}) {
  const accentRing =
    accent === "rose"
      ? "group-hover:shadow-[0_0_28px_rgba(244,63,94,0.2)]"
      : accent === "amber"
        ? "group-hover:shadow-[0_0_28px_rgba(251,191,36,0.2)]"
        : accent === "violet"
          ? "group-hover:shadow-[0_0_28px_rgba(167,139,250,0.2)]"
          : "group-hover:shadow-[0_0_28px_rgba(34,211,238,0.2)]";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`group glass-panel widget-shell relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl p-5 transition-shadow duration-300 ${accentRing} ${span} ${className}`.trim()}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl trust-pulse" />
      <header className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {Icon ? (
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
              whileHover={{ scale: 1.05 }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </motion.div>
          ) : null}
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {subtitle ? <p className="text-[11px] text-slate-500">{subtitle}</p> : null}
          </motion.div>
        </motion.div>
        {href ? (
          <Link
            to={href}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800/60 hover:text-cyan-300"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </header>
      <div className="relative z-10 flex flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-4">
            <LoadingSpinner label="Syncing…" />
          </div>
        ) : error ? (
          <p className="text-xs leading-relaxed text-rose-300/90">{error}</p>
        ) : (
          children
        )}
      </div>
    </motion.article>
  );
}
