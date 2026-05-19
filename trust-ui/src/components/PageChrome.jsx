import { motion } from "framer-motion";

export function PageChrome({ eyebrow, title, description, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <header className="border-b border-slate-800/50 pb-5">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
        ) : null}
      </header>
      {children}
    </motion.div>
  );
}
