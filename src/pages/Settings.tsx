import { isFirebaseConfigured } from '../firebase/config';
import { useAuth } from '../firebase/auth';

export default function Settings({ notify }: { notify: (t: string) => void }) {
  const { user, logout } = useAuth();
  const dbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL as string;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="glass space-y-2 p-5">
        <h3 className="font-bold">Environment</h3>
        <div className="text-xs text-slate-400">Database URL</div>
        <code className="block break-all rounded-lg bg-black/30 p-2 font-mono text-[11px] text-sky-300">{dbUrl || '(missing)'}</code>
        <div className="text-xs">Firebase configured: <span className={isFirebaseConfigured ? 'text-emerald-300' : 'text-rose-300'}>{isFirebaseConfigured ? 'Yes' : 'No'}</span></div>
        <div className="text-xs text-slate-400">Admin allowlist: {(import.meta.env.VITE_ADMIN_EMAILS as string) || '(any authenticated user)'}</div>
        <div className="text-xs text-slate-500">
          Extension setup: the Database URL is pre-configured in <code>extension/config.js</code> — just load the extension, no manual step needed.
        </div>
      </div>
      <div className="glass space-y-2 p-5">
        <h3 className="font-bold">Account</h3>
        <div className="text-sm text-slate-300">{user?.email}</div>
        <div className="text-xs text-slate-500">UID: {user?.uid}</div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(dbUrl || ''); notify('Database URL copied'); }}>Copy DB URL</button>
          <button className="btn-ghost" onClick={() => logout()}>Sign out</button>
        </div>
        <h3 className="pt-3 font-bold">Data & privacy</h3>
        <p className="text-xs leading-relaxed text-slate-400">
          Browser Guard collects only page title, URL, domain and active time from enrolled browsers.
          It never collects passwords, keystrokes, cookies, form data or page contents.
          Activity older than your retention policy should be deleted with a scheduled Cloud Function (see firebase/README.md).
        </p>
      </div>
    </div>
  );
}
