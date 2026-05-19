import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Shield, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { NAV_MODULES } from "./navConfig.js";

const linkClass = ({ isActive }) =>
  [
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-cyan-500/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
      : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
  ].join(" ");

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  const width = collapsed ? "w-[72px]" : "w-64";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <motion.div
        className="flex items-center gap-3 border-b border-slate-800/80 px-4 py-4"
        layout
      >
        <motion.div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_24px_rgba(34,211,238,0.4)]"
          whileHover={{ scale: 1.05 }}
        >
          <Shield className="h-5 w-5 text-slate-950" aria-hidden />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                TRUST OS
              </p>
              <p className="truncate text-xs font-medium text-slate-300">Command Center</p>
            </motion.div>
          )}
        </AnimatePresence>
        {mobileOpen ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </motion.div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {NAV_MODULES.map((mod) => (
          <div key={mod.id} className="mb-5">
            {!collapsed ? (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                {mod.label}
              </p>
            ) : (
              <motion.div
                className="mx-auto mb-2 h-px w-8 bg-slate-800"
                layout
              />
            )}
            <ul className="space-y-0.5">
              {mod.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onMobileClose}
                      className={linkClass}
                      title={collapsed ? item.label : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                          ) : null}
                          <Icon
                            className={`h-4 w-4 shrink-0 transition ${isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-cyan-300/80"}`}
                          />
                          {!collapsed ? <span>{item.label}</span> : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-slate-800/80 p-2 lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-slate-500 transition hover:bg-slate-800/60 hover:text-cyan-300"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
            aria-label="Close navigation overlay"
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        layout
        className={`command-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${width} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
