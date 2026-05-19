import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Command, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommandPalette } from "../context/CommandPaletteContext.jsx";
import { COMMAND_QUICK_ACTIONS, flattenNavItems } from "./navConfig.js";

export function CommandPalette() {
  const { open, close } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const allItems = useMemo(() => {
    const nav = flattenNavItems().map((item) => ({
      id: item.path,
      label: item.label,
      hint: item.module,
      path: item.path,
      keywords: `${item.label} ${item.keywords || ""} ${item.module}`,
      type: "navigate",
    }));
    const actions = COMMAND_QUICK_ACTIONS.map((a) => ({
      id: a.id,
      label: a.label,
      hint: "Quick command",
      path: a.path,
      keywords: `${a.label} ${a.keywords || ""}`,
      type: "action",
    }));
    return [...actions, ...nav];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 12);
    return allItems
      .filter((item) => item.keywords.toLowerCase().includes(q) || item.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [allItems, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function run(item) {
    close();
    navigate(item.path);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      run(filtered[activeIndex]);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm"
            onClick={close}
            aria-label="Close command palette"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18 }}
            className="command-palette fixed left-1/2 top-[12vh] z-[101] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/95 shadow-[0_0_60px_rgba(34,211,238,0.15)] backdrop-blur-xl"
          >
            <motion.div
              className="flex items-center gap-3 border-b border-slate-800/80 px-4 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Command className="h-4 w-4 text-cyan-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search services, navigate, run commands…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                esc
              </kbd>
            </motion.div>
            <ul className="max-h-[min(360px,50vh)] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-slate-500">No matches</li>
              ) : (
                filtered.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => run(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        index === activeIndex
                          ? "bg-cyan-500/15 text-cyan-100"
                          : "text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      {item.type === "action" ? (
                        <Sparkles className="h-4 w-4 shrink-0 text-fuchsia-400" />
                      ) : (
                        <ArrowRight className="h-4 w-4 shrink-0 text-cyan-400" />
                      )}
                      <span className="flex-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="ml-2 text-xs text-slate-500">{item.hint}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
