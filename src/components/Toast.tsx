export type Toast = { id: number; text: string };

export function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-72 flex-col gap-2">
      {toasts.slice(-4).map((t) => (
        <div key={t.id} className="glass pointer-events-auto border-sky-500/30 p-3 text-xs text-slate-200 shadow-xl">
          {t.text}
        </div>
      ))}
    </div>
  );
}
