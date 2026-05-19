import { motion } from "framer-motion";

const toneStyles = {
  gateway: { border: "border-cyan-500/40", bg: "bg-cyan-500/5", label: "text-cyan-300" },
  fraud: { border: "border-rose-500/40", bg: "bg-rose-500/5", label: "text-rose-300" },
  monitoring: { border: "border-amber-500/40", bg: "bg-amber-500/5", label: "text-amber-300" },
  trust: { border: "border-violet-500/40", bg: "bg-violet-500/5", label: "text-violet-300" },
  advisor: { border: "border-fuchsia-500/40", bg: "bg-fuchsia-500/5", label: "text-fuchsia-300" },
  auth: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", label: "text-emerald-300" },
  default: { border: "border-slate-700", bg: "bg-slate-900/40", label: "text-slate-300" },
};

export function EventTimeline({ events, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div key={i} className="widget-skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <p className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500">
        No ecosystem events recorded in this session.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-cyan-500/20 pl-6">
      {events.map((event, index) => {
        const tone = toneStyles[event.category] || toneStyles.default;
        return (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            className="relative pb-6 last:pb-0"
          >
            <span className="absolute -left-[1.65rem] top-1.5 flex h-3 w-3 items-center justify-center">
              <span
                className={`h-2.5 w-2.5 rounded-full ${event.pulse ? "trust-pulse bg-cyan-400" : "bg-slate-600"}`}
              />
            </span>
            <motion.div
              className={`rounded-xl border p-4 ${tone.border} ${tone.bg}`}
              whileHover={{ scale: 1.005 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${tone.label}`}>
                    {event.category}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white">{event.title}</p>
                </div>
                <time className="text-[10px] text-slate-500">{event.time}</time>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{event.message}</p>
              {event.meta ? (
                <p className="mt-2 font-mono text-[10px] text-slate-600">{event.meta}</p>
              ) : null}
            </motion.div>
          </motion.li>
        );
      })}
    </ol>
  );
}
