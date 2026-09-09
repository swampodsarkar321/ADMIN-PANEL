import { useAuth } from '../firebase/auth';
import { ADMIN_EMAILS } from '../firebase/config';

/** Admin page: account info + allowlist guidance. */
export default function Admin() {
  const { user } = useAuth();
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="glass space-y-2 p-5">
        <h3 className="font-bold">Administrator</h3>
        <div className="text-sm">Email: <span className="text-sky-300">{user?.email}</span></div>
        <div className="text-xs text-slate-400">UID: <code className="font-mono">{user?.uid}</code></div>
        <div className="text-xs text-slate-400">Email verified: {user?.emailVerified ? 'yes' : 'no'}</div>
      </div>
      <div className="glass space-y-2 p-5">
        <h3 className="font-bold">Access control</h3>
        <p className="text-xs leading-relaxed text-slate-400">
          Dashboard access is controlled by Firebase Authentication plus an optional email allowlist
          (<code>VITE_ADMIN_EMAILS</code>). Database reads require <code>auth != null</code> (see
          <code> firebase/database.rules.json</code>).
        </p>
        <div className="text-xs">Allowlisted emails: {ADMIN_EMAILS.length ? ADMIN_EMAILS.join(', ') : '(any authenticated user)'}</div>
        <div className="text-xs text-slate-500">
          To add an admin: Firebase Console → Authentication → Users → Add user, then add their email to
          <code> VITE_ADMIN_EMAILS</code> and redeploy.
        </div>
      </div>
    </div>
  );
}
