export function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 sm:p-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
