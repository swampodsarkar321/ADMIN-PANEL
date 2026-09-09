import { useState } from 'react';
import { useAuth } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-sm p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl">🛡️</div>
        <h1 className="mt-4 text-center text-xl font-extrabold tracking-wide">BROWSER GUARD</h1>
        <p className="mt-1 text-center text-sm text-slate-400">Admin Login</p>
        {!isFirebaseConfigured && (
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-300">
            Firebase is not configured. Copy <code>admin/.env.example</code> to <code>.env</code> and fill in your project keys.
          </div>
        )}
        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            setBusy(true);
            try {
              await login(email, password);
            } catch (e: any) {
              setErr(e?.message || 'Sign in failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className="text-xs text-slate-400">Email</label>
            <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Password</label>
            <input className="input mt-1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">{err}</div>}
          <button className="btn-primary w-full justify-center" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p className="mt-4 text-center text-[11px] text-slate-500">Consent-based management of enrolled browsers only.</p>
      </div>
    </div>
  );
}
