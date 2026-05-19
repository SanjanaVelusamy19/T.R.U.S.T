import { motion } from "framer-motion";

export function DashboardSection({ title, subtitle, children, columns = "sm:grid-cols-2 xl:grid-cols-4" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="border-b border-slate-800/60 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className={`grid gap-5 ${columns}`}>{children}</div>
    </motion.section>
  );
}
