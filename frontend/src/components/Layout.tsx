import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// The frame of every page that needs a logged-in user.
export function Layout() {
  const { session, signOut } = useAuth();

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  const roleLabel = session.role === 'OPERATOR' ? 'Operador' : 'Distribuidor';

  return (
    <div>
      <header className="topbar">
        <Link to="/orders" className="brand">
          Pedidos de combustible
        </Link>
        <div className="topbar-user">
          <span>
            {session.name} · {roleLabel}
          </span>
          <button type="button" className="secondary" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
