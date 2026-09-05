interface PasswordGateProps {
  children: React.ReactNode;
}

/**
 * Static GitHub Pages has no /api/auth. The shop is public.
 * Set VITE_REQUIRE_PASSWORD_GATE=1 only for local experiments; it still cannot
 * authenticate on Pages because there is no server.
 */
export default function PasswordGate({ children }: PasswordGateProps) {
  return <>{children}</>;
}
