export default function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      <button className="btn-ghost !py-1" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
      <span className="text-slate-400">{page} / {totalPages}</span>
      <button className="btn-ghost !py-1" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
