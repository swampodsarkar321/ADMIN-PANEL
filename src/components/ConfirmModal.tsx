export default function ConfirmModal({ title, body, confirmLabel = 'Confirm', onConfirm, onCancel, busy }: { title: string; body: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="glass w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary !bg-rose-500 hover:!bg-rose-400" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
