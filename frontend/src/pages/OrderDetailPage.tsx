import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import {
  approveOrder,
  cancelOrder,
  dispatchOrder,
  getOrder,
  listProducts,
  rejectOrder,
} from '../api/endpoints';
import type { Order, Product } from '../api/types';
import { useSession } from '../auth/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatGallons, formatMoney } from '../lib/format';

export function OrderDetailPage() {
  const session = useSession();
  const params = useParams();
  const orderId = params.orderId ?? '';

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reason, setReason] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    getOrder(session.accessToken, orderId)
      .then(setOrder)
      .catch((caught) => setLoadError(getErrorMessage(caught)));
    listProducts(session.accessToken)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [session.accessToken, orderId]);

  function getProductName(productId: string): string {
    for (const product of products) {
      if (product.id === productId) {
        return product.name;
      }
    }
    return productId;
  }

  // Runs one of the actions and shows the order the backend returns
  async function runAction(action: () => Promise<Order>): Promise<void> {
    setActionError(null);
    setIsSending(true);
    try {
      const updatedOrder = await action();
      setOrder(updatedOrder);
      setReason('');
    } catch (caught) {
      setActionError(getErrorMessage(caught));
    } finally {
      setIsSending(false);
    }
  }

  if (loadError !== null) {
    return (
      <section>
        <ErrorMessage message={loadError} />
        <Link to="/orders">Volver a pedidos</Link>
      </section>
    );
  }

  if (order === null) {
    return <p className="muted">Cargando…</p>;
  }

  // Which buttons to show, by role and status.
  // It is only for convenience: the backend checks the permission again.
  const isOperator = session.role === 'OPERATOR';
  const isPending = order.status === 'PENDING';
  const isApproved = order.status === 'APPROVED';

  const canApproveOrReject = isOperator && isPending;
  const canDispatch = isOperator && isApproved;
  const canCancel = !isOperator && isPending;
  const hasActions = canApproveOrReject || canDispatch || canCancel;

  const token = session.accessToken;

  return (
    <section>
      <div className="page-header">
        <h1>Detalle del pedido</h1>
        <Link to="/orders">Volver a pedidos</Link>
      </div>

      <div className="card summary">
        <div>
          <span className="muted">Estado</span>
          <StatusBadge status={order.status} />
        </div>
        <div>
          <span className="muted">Creado</span>
          <strong>{formatDateTime(order.createdAt)}</strong>
        </div>
        <div>
          <span className="muted">Entrega solicitada</span>
          <strong>{formatDateTime(order.deliveryDate)}</strong>
        </div>
        <div>
          <span className="muted">Último cambio de estado</span>
          <strong>{formatDateTime(order.statusChangedAt)}</strong>
        </div>
      </div>

      {order.rejectionReason !== null && (
        <div className="alert error">
          <p>
            <strong>Motivo del rechazo:</strong> {order.rejectionReason}
          </p>
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th className="number">Galones</th>
              <th className="number">Precio por galón</th>
              <th className="number">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.productId}>
                <td>{getProductName(line.productId)}</td>
                <td className="number">{formatGallons(line.gallons)}</td>
                <td className="number">{formatMoney(line.unitPriceCents)}</td>
                <td className="number">{formatMoney(line.subtotalCents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th className="number">{formatGallons(order.totalGallons)}</th>
              <th></th>
              <th className="number">{formatMoney(order.totalCents)}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card">
        <h2>Acciones</h2>

        {!hasActions && (
          <p className="muted">
            No hay acciones disponibles para tu rol en este estado.
          </p>
        )}

        {canApproveOrReject && (
          <div className="actions">
            <button
              type="button"
              disabled={isSending}
              onClick={() => runAction(() => approveOrder(token, order.id))}
            >
              Aprobar
            </button>

            <div className="reject">
              <label htmlFor="reason">Motivo del rechazo</label>
              <textarea
                id="reason"
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <button
                type="button"
                className="danger-button"
                disabled={isSending || reason.trim() === ''}
                onClick={() =>
                  runAction(() => rejectOrder(token, order.id, reason))
                }
              >
                Rechazar
              </button>
            </div>
          </div>
        )}

        {canDispatch && (
          <button
            type="button"
            disabled={isSending}
            onClick={() => runAction(() => dispatchOrder(token, order.id))}
          >
            Marcar como despachado
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            className="danger-button"
            disabled={isSending}
            onClick={() => runAction(() => cancelOrder(token, order.id))}
          >
            Cancelar pedido
          </button>
        )}

        <ErrorMessage message={actionError} />
      </div>
    </section>
  );
}
