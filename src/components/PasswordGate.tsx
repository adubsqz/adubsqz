import { useState, useEffect, FormEvent } from 'react';

interface PasswordGateProps {
  children: React.ReactNode;
}

const CORRECT_PASSWORD = 'film2024'; // Change this to your desired password

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const auth = sessionStorage.getItem('photo_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('photo_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
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
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-photo-accent hover:bg-photo-accent/80 text-photo-bg font-medium rounded-lg uppercase tracking-wider text-sm transition-colors"
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
