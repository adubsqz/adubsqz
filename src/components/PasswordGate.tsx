import { useState, useEffect, FormEvent } from 'react';

interface PasswordGateProps {
  children: React.ReactNode;
}

const e2eBypass = import.meta.env.VITE_E2E === '1';
/** Plain `vite` dev server (`MODE===development`): no password; never true in prod bundle or Vitest (`MODE=test`). */
const preferGateInDev = import.meta.env.VITE_REQUIRE_PASSWORD_GATE === '1';
const developmentBypass =
  import.meta.env.DEV && import.meta.env.MODE === 'development' && !preferGateInDev;

const bypassGate = e2eBypass || developmentBypass;

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(bypassGate);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!bypassGate);
  const [submitting, setSubmitting] = useState(false);
  const [misconfigured, setMisconfigured] = useState(false);

  useEffect(() => {
    if (bypassGate) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'GET',
          credentials: 'same-origin',
        });
        if (!res.ok) {
          // Treat any non-2xx as "show the gate" rather than crashing the app.
          if (!cancelled) setLoading(false);
          return;
        }
        const data = (await res.json()) as {
          authenticated?: boolean;
          required?: boolean;
          misconfigured?: boolean;
        };
        if (cancelled) return;
        if (data.misconfigured) setMisconfigured(true);
        if (data.authenticated) {
          setIsAuthenticated(true);
        }
      } catch {
        // Network error: leave gate visible; user can retry by submitting.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setPassword('');
        return;
      }

      if (res.status === 503) {
        setError('Gallery is temporarily locked (server configuration).');
      } else if (res.status === 401) {
        setError('Incorrect password');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setPassword('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-photo-bg">
        <div className="text-photo-muted">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-photo-fg font-sans antialiased">
        <div className="w-full max-w-md px-6">
          <div className="rounded-3xl bg-photo-panel/95 shadow-[0_26px_80px_rgba(0,0,0,0.9)] backdrop-blur-md p-8 sm:p-10">
            <h1 className="text-2xl font-medium tracking-tight mb-2">
              adubsqz
            </h1>
            <p className="text-photo-muted text-sm mb-6">
              Enter password to view photography portfolio
            </p>
            {misconfigured && (
              <div
                className="mb-6 rounded-xl border border-photo-border bg-white/[0.04] px-4 py-3 text-sm text-photo-fg/90"
                role="status"
              >
                Gallery access is temporarily unavailable. Please try again later or contact the site owner.
              </div>
            )}
            <div className="rounded-xl border border-white/20 bg-photo-bg/80 p-4 mb-6 text-center">
              <p className="text-xs font-medium text-photo-muted uppercase tracking-wider mb-2">
                Film + TV Clearance Guarantee
              </p>
              <p className="text-sm text-photo-fg/90 leading-relaxed">
                All photography is 100% owned, unencumbered, and pre-cleared for Film, Television, and Commercial broadcast.
              </p>
              <p className="text-xs text-photo-muted mt-3">
                By entering the password below, you acknowledge and consent to this guarantee.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2 text-photo-muted uppercase tracking-wider"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-photo-bg border border-photo-border rounded-lg focus:outline-none focus:ring-2 focus:ring-photo-accent focus:border-transparent text-photo-fg"
                  placeholder="Enter password"
                  autoFocus
                  autoComplete="current-password"
                  disabled={submitting || misconfigured}
                />
                {error && (
                  <p className="mt-2 text-sm text-photo-muted">{error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting || !password || misconfigured}
                className="w-full px-6 py-3 bg-photo-accent hover:bg-photo-accent/80 disabled:opacity-60 disabled:cursor-not-allowed text-photo-bg font-medium rounded-lg uppercase tracking-wider text-sm transition-colors"
              >
                {submitting ? 'Checking…' : 'Enter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
