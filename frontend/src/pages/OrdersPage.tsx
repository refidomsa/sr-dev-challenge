import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { PAGE_SIZE, listDistributors, listOrders } from '../api/endpoints';
import type { Distributor, OrderFilters, OrderList } from '../api/types';
import { useSession } from '../auth/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { StatusBadge } from '../components/StatusBadge';
import {
  STATUS_LABELS,
  formatDateTime,
  formatGallons,
  formatMoney,
} from '../lib/format';

const EMPTY_FILTERS: OrderFilters = {
  status: '',
  distributorId: '',
  deliveryFrom: '',
  deliveryTo: '',
  page: 1,
};

export function OrdersPage() {
  const session = useSession();
  const isOperator = session.role === 'OPERATOR';

  const [filters, setFilters] = useState<OrderFilters>(EMPTY_FILTERS);
  const [orderList, setOrderList] = useState<OrderList | null>(null);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the orders again every time a filter or the page changes
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    listOrders(session.accessToken, filters)
      .then((result) => {
        if (isCurrent) {
          setOrderList(result);
          setError(null);
        }
      })
      .catch((caught) => {
        if (isCurrent) {
          setError(getErrorMessage(caught));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    // If the filters change before the answer arrives, ignore the old answer
    return () => {
      isCurrent = false;
    };
  }, [session.accessToken, filters]);

  // Only the operator can filter by distributor
  useEffect(() => {
    if (!isOperator) {
      return;
    }
    listDistributors(session.accessToken)
      .then(setDistributors)
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [session.accessToken, isOperator]);

  // Changing a filter always goes back to the first page
  function changeFilter(name: keyof OrderFilters, value: string): void {
    setFilters({ ...filters, [name]: value, page: 1 });
  }

  function getDistributorName(distributorId: string): string {
    for (const distributor of distributors) {
      if (distributor.id === distributorId) {
        return distributor.name;
      }
    }
    return distributorId;
  }

  const total = orderList === null ? 0 : orderList.total;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section>
      <div className="page-header">
        <h1>Pedidos</h1>
        {!isOperator && (
          <Link to="/orders/new" className="button">
            Nuevo pedido
          </Link>
        )}
      </div>

      <div className="card filters">
        <div>
          <label htmlFor="status">Estado</label>
          <select
            id="status"
            value={filters.status}
            onChange={(event) => changeFilter('status', event.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {isOperator && (
          <div>
            <label htmlFor="distributor">Distribuidor</label>
            <select
              id="distributor"
              value={filters.distributorId}
              onChange={(event) =>
                changeFilter('distributorId', event.target.value)
              }
            >
              <option value="">Todos</option>
              {distributors.map((distributor) => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="from">Entrega desde</label>
          <input
            id="from"
            type="date"
            value={filters.deliveryFrom}
            onChange={(event) => changeFilter('deliveryFrom', event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="to">Entrega hasta</label>
          <input
            id="to"
            type="date"
            value={filters.deliveryTo}
            onChange={(event) => changeFilter('deliveryTo', event.target.value)}
          />
        </div>

        <button
          type="button"
          className="secondary"
          onClick={() => setFilters(EMPTY_FILTERS)}
        >
          Limpiar
        </button>
      </div>

      <ErrorMessage message={error} />

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Creado</th>
              {isOperator && <th>Distribuidor</th>}
              <th>Entrega</th>
              <th className="number">Galones</th>
              <th className="number">Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orderList !== null &&
              orderList.items.map((order) => (
                <tr key={order.id}>
                  <td>{formatDateTime(order.createdAt)}</td>
                  {isOperator && (
                    <td>{getDistributorName(order.distributorId)}</td>
                  )}
                  <td>{formatDateTime(order.deliveryDate)}</td>
                  <td className="number">{formatGallons(order.totalGallons)}</td>
                  <td className="number">{formatMoney(order.totalCents)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>
                    <Link to={`/orders/${order.id}`}>Ver detalle</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {isLoading && <p className="muted padded">Cargando…</p>}
        {!isLoading && total === 0 && error === null && (
          <p className="muted padded">No hay pedidos con estos filtros.</p>
        )}
      </div>

      <div className="pagination">
        <button
          type="button"
          className="secondary"
          disabled={filters.page <= 1}
          onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
        >
          Anterior
        </button>
        <span>
          Página {filters.page} de {lastPage} · {total} pedidos
        </span>
        <button
          type="button"
          className="secondary"
          disabled={filters.page >= lastPage}
          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
