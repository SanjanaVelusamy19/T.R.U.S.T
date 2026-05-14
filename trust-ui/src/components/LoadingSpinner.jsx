export function LoadingSpinner({ label = "Processing secure request…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border border-cyan-400/25" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-300 border-l-fuchsia-400 trust-pulse" />
      </div>
      <p className="text-sm text-slate-300">{label}</p>
    </div>
  );
}
