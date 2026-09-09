import { Menu, Bell, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../firebase/auth';

export type ToastMsg = { id: number; text: string };

export default function Topbar({ title, onMenu, toasts }: { title: string; onMenu: () => void; toasts: ToastMsg[] }) {
  const { logout } = useAuth();
  const [show, setShow] = useState(false);
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 bg-[#0b1220]/80 px-4 py-3 backdrop-blur-xl">
      <button className="btn-ghost md:hidden" onClick={onMenu} aria-label="Menu"><Menu size={16} /></button>
      <h1 className="text-lg font-bold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button className="btn-ghost" onClick={() => setShow((s) => !s)} aria-label="Notifications">
            <Bell size={16} />
            {toasts.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">{toasts.length}</span>
            )}
          </button>
          {show && (
            <div className="glass absolute right-0 mt-2 w-72 p-2 text-xs">
              {toasts.length === 0 && <div className="p-3 text-slate-400">No notifications</div>}
              {toasts.slice(-8).reverse().map((t) => (
                <div key={t.id} className="rounded-lg px-3 py-2 hover:bg-white/5">{t.text}</div>
              ))}
            </div>
          )}
        </div>
        <button className="btn-ghost md:hidden" onClick={() => logout()} aria-label="Sign out"><LogOut size={16} /></button>
      </div>
    </header>
  );
}
