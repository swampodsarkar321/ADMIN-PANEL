export default function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="glass flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      {label}
    </div>
  );
}
