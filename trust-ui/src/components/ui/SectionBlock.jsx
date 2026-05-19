export function SectionBlock({ title, subtitle, children, className = "" }) {
  return (
    <section className={`space-y-4 ${className}`.trim()}>
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
