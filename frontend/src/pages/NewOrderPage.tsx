import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError, getErrorMessage } from '../api/client';
import {
  createOrder,
  getAvailableCredit,
  listProducts,
} from '../api/endpoints';
import type { AvailableCredit, NewOrderLine, Product } from '../api/types';
import { useSession } from '../auth/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatGallons, formatMoney } from '../lib/format';
import {
  MAXIMUM_GALLONS_PER_ORDER,
  MAXIMUM_LINES_PER_ORDER,
  MINIMUM_GALLONS_PER_LINE,
  toDeliveryDate,
  validateOrder,
} from '../lib/order-rules';
import type { FormLine } from '../lib/order-rules';

const EMPTY_LINE: FormLine = { productId: '', gallons: '' };

export function NewOrderPage() {
  const session = useSession();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [credit, setCredit] = useState<AvailableCredit | null>(null);
  const [lines, setLines] = useState<FormLine[]>([EMPTY_LINE]);
  const [deliveryInput, setDeliveryInput] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const distributorId = session.distributorId;

  useEffect(() => {
    if (distributorId === null) {
      return;
    }
    listProducts(session.accessToken)
      .then(setProducts)
      .catch((caught) => setError(getErrorMessage(caught)));
    getAvailableCredit(session.accessToken, distributorId)
      .then(setCredit)
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [session.accessToken, distributorId]);

  // Only distributors create orders
  if (distributorId === null) {
    return <Navigate to="/orders" replace />;
  }

  function getPriceCents(productId: string): number {
    for (const product of products) {
      if (product.id === productId) {
        return product.pricePerGallonCents;
      }
    }
    return 0;
  }

  function getSubtotalCents(line: FormLine): number {
    const gallons = Number(line.gallons);
    if (!Number.isFinite(gallons)) {
      return 0;
    }
    return gallons * getPriceCents(line.productId);
  }

  let totalCents = 0;
  let totalGallons = 0;
  for (const line of lines) {
    totalCents = totalCents + getSubtotalCents(line);
    const gallons = Number(line.gallons);
    if (Number.isFinite(gallons)) {
      totalGallons = totalGallons + gallons;
    }
  }

  const availableCreditCents =
    credit === null ? null : credit.availableCreditCents;
  const exceedsCredit =
    availableCreditCents !== null && totalCents > availableCreditCents;

  function changeLine(index: number, name: keyof FormLine, value: string): void {
    const newLines = lines.map((line, position) => {
      if (position === index) {
        return { ...line, [name]: value };
      }
      return line;
    });
    setLines(newLines);
  }

  function addLine(): void {
    setLines([...lines, EMPTY_LINE]);
  }

  function removeLine(index: number): void {
    setLines(lines.filter((_line, position) => position !== index));
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setErrorDetails([]);

    const foundProblems = validateOrder(
      lines,
      deliveryInput,
      totalCents,
      availableCreditCents,
    );
    setProblems(foundProblems);
    if (foundProblems.length > 0) {
      return;
    }

    const newLines: NewOrderLine[] = lines.map((line) => ({
      productId: line.productId,
      gallons: Number(line.gallons),
    }));

    setIsSending(true);
    try {
      const order = await createOrder(
        session.accessToken,
        toDeliveryDate(deliveryInput).toISOString(),
        newLines,
      );
      navigate(`/orders/${order.id}`);
    } catch (caught) {
      // The backend has the last word: show what it answered
      setError(getErrorMessage(caught));
      if (caught instanceof ApiError) {
        setErrorDetails(caught.fieldErrors);
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Nuevo pedido</h1>
        <Link to="/orders">Volver a pedidos</Link>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="card">
          <label htmlFor="delivery">Fecha y hora de entrega (hora dominicana)</label>
          <input
            id="delivery"
            type="datetime-local"
            value={deliveryInput}
            onChange={(event) => setDeliveryInput(event.target.value)}
          />
          <p className="muted">
            Al menos 24 horas después de ahora. No se entrega los domingos.
          </p>
        </div>

        <div className="card">
          <h2>Líneas</h2>
          <p className="muted">
            Mínimo {formatGallons(MINIMUM_GALLONS_PER_LINE)} galones por línea,
            máximo {formatGallons(MAXIMUM_GALLONS_PER_ORDER)} por pedido, sin
            repetir productos.
          </p>

          {lines.map((line, index) => (
            <div className="line" key={index}>
              <div>
                <label htmlFor={`product-${index}`}>Producto</label>
                <select
                  id={`product-${index}`}
                  value={line.productId}
                  onChange={(event) =>
                    changeLine(index, 'productId', event.target.value)
                  }
                >
                  <option value="">Selecciona…</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {formatMoney(product.pricePerGallonCents)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`gallons-${index}`}>Galones</label>
                <input
                  id={`gallons-${index}`}
                  type="number"
                  min={MINIMUM_GALLONS_PER_LINE}
                  step={1}
                  value={line.gallons}
                  onChange={(event) =>
                    changeLine(index, 'gallons', event.target.value)
                  }
                />
              </div>
              <div className="line-subtotal">
                <span className="muted">Subtotal</span>
                <strong>{formatMoney(getSubtotalCents(line))}</strong>
              </div>
              <button
                type="button"
                className="secondary"
                disabled={lines.length <= 1}
                onClick={() => removeLine(index)}
              >
                Quitar
              </button>
            </div>
          ))}

          <button
            type="button"
            className="secondary"
            disabled={lines.length >= MAXIMUM_LINES_PER_ORDER}
            onClick={addLine}
          >
            Agregar línea
          </button>
        </div>

        <div className="card summary">
          <div>
            <span className="muted">Total de galones</span>
            <strong>{formatGallons(totalGallons)}</strong>
          </div>
          <div>
            <span className="muted">Total del pedido</span>
            <strong className={exceedsCredit ? 'danger' : ''}>
              {formatMoney(totalCents)}
            </strong>
          </div>
          <div>
            <span className="muted">Crédito disponible</span>
            <strong>
              {availableCreditCents === null
                ? '…'
                : formatMoney(availableCreditCents)}
            </strong>
          </div>
        </div>

        {problems.length > 0 && (
          <div className="alert error" role="alert">
            <p>Corrige lo siguiente antes de enviar:</p>
            <ul>
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        <ErrorMessage message={error} details={errorDetails} />

        <button type="submit" disabled={isSending}>
          {isSending ? 'Enviando…' : 'Crear pedido'}
        </button>
      </form>
    </section>
  );
}
