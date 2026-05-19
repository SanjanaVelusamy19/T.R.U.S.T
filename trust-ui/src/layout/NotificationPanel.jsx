import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationContext.jsx";

const toneStyles = {
  info: "border-cyan-500/30 bg-cyan-500/5",
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  alert: "border-rose-500/30 bg-rose-500/5",
};

export function NotificationPanel({ open, onClose }) {
  const { items, markRead, markAllRead, unreadCount } = useNotifications();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-transparent"
            onClick={onClose}
            aria-label="Close notifications"
          />
          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="fixed right-2 top-14 z-[95] w-[min(380px,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl sm:right-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Bell className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Intelligence feed</span>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                    {unreadCount} new
                  </span>
                ) : null}
              </motion.div>
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-800 hover:text-cyan-300"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </button>
            </div>
            <ul className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  Ecosystem signals will appear here.
                </li>
              ) : (
                items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className={`mb-1 w-full rounded-xl border p-3 text-left transition hover:brightness-110 ${
                        toneStyles[n.tone] || toneStyles.info
                      } ${n.read ? "opacity-60" : ""}`}
                    >
                      <p className="text-xs font-semibold text-white">{n.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{n.message}</p>
                      <p className="mt-2 text-[10px] text-slate-600">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
