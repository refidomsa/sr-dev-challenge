import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { login } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';

export function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (session !== null) {
    return <Navigate to="/orders" replace />;
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSending(true);
    try {
      const newSession = await login(email, password);
      signIn(newSession);
      navigate('/orders');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="login">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Pedidos de combustible</h1>
        <p className="muted">Inicia sesión para continuar.</p>

        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <ErrorMessage message={error} />

        <button type="submit" disabled={isSending}>
          {isSending ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </main>
  );
}
