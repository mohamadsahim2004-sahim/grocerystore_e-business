import React, {
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';

import { Link } from 'react-router-dom';

import {
  StoreContext
} from '../context/StoreContext';

import api, {
  getErrorMessage
} from '../api/client';

import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

import {
  AlertIcon,
  BagIcon,
  PackageIcon,
  UsersIcon
} from '../components/Icons';

import {
  formatOrderDate
} from '../lib/orderFormat';

const ICON_BY_METRIC = {
  totalProducts: BagIcon,
  totalOrders: PackageIcon,
  totalUsers: UsersIcon,
  pendingOrders: PackageIcon,
  revenue: PackageIcon
};

function SalesChart({
  data,
  formatPrice
}) {
  const width = 700;
  const height = 220;

  const padding = {
    top: 12,
    right: 12,
    bottom: 26,
    left: 12
  };

  const safeData =
    Array.isArray(data)
      ? data
      : [];

  if (safeData.length === 0) {
    return (
      <div className="admin-empty-note">
        No sales data available.
      </div>
    );
  }

  const max = Math.max(
    1,
    ...safeData.map(
      (d) =>
        Number(d.revenue) || 0
    )
  );

  const barGap = 6;

  const barWidth =
    (width -
      padding.left -
      padding.right) /
      safeData.length -
    barGap;

  return (
    <svg
      className="sales-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Revenue for the last 14 days"
    >
      {safeData.map(
        (d, i) => {
          const revenue =
            Number(d.revenue) || 0;

          const orders =
            Number(d.orders) || 0;

          const barHeight =
            (revenue / max) *
            (height -
              padding.top -
              padding.bottom);

          const x =
            padding.left +
            i *
              (barWidth +
                barGap);

          const y =
            height -
            padding.bottom -
            barHeight;

          const showLabel =
            i % 2 === 0 ||
            safeData.length <= 7;

          return (
            <g
              key={`${d.date}-${i}`}
            >
              <rect
                x={x}
                y={y}
                width={Math.max(
                  barWidth,
                  1
                )}
                height={Math.max(
                  barHeight,
                  revenue > 0
                    ? 2
                    : 0
                )}
                rx="3"
                className={
                  revenue > 0
                    ? 'sales-chart__bar'
                    : 'sales-chart__bar sales-chart__bar--empty'
                }
              >
                <title>
                  {new Date(
                    d.date
                  ).toLocaleDateString(
                    'en-US',
                    {
                      month:
                        'short',
                      day: 'numeric'
                    }
                  )}
                  :{' '}
                  {formatPrice(
                    revenue
                  )}{' '}
                  (
                  {orders}{' '}
                  {orders === 1
                    ? 'order'
                    : 'orders'}
                  )
                </title>
              </rect>

              {showLabel && (
                <text
                  x={
                    x +
                    barWidth /
                      2
                  }
                  y={
                    height - 8
                  }
                  textAnchor="middle"
                  className="sales-chart__label"
                >
                  {new Date(
                    d.date
                  ).toLocaleDateString(
                    'en-US',
                    {
                      day:
                        'numeric',
                      month:
                        'numeric'
                    }
                  )}
                </text>
              )}
            </g>
          );
        }
      )}
    </svg>
  );
}

export default function AdminDashboard() {
  const store =
    useContext(StoreContext);

  const formatPrice =
    typeof store?.formatPrice ===
    'function'
      ? store.formatPrice
      : (amount) =>
          `$${Number(
            amount || 0
          ).toFixed(2)}`;

  const [
    state,
    setState
  ] = useState({
    status: 'loading',
    data: null,
    error: ''
  });

  const [attempt, setAttempt] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    setState((prev) => ({
      ...prev,
      status: 'loading'
    }));

    api
      .get('/admin/dashboard')
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        if (!data) {
          throw new Error(
            'Dashboard returned an empty response.'
          );
        }

        setState({
          status: 'ready',
          data,
          error: ''
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error:
              getErrorMessage(
                err,
                'Could not load the dashboard.'
              )
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(
    () =>
      setAttempt(
        (n) => n + 1
      ),
    []
  );

  if (
    state.status ===
    'loading'
  ) {
    return (
      <LoadingSpinner
        size="lg"
        label="Loading dashboard..."
      />
    );
  }

  if (
    state.status ===
    'error'
  ) {
    return (
      <EmptyState
        icon={
          <AlertIcon
            size={32}
          />
        }
        title="We couldn't load the dashboard"
        message={state.error}
        action={{
          label: 'Try again',
          onClick: retry
        }}
      />
    );
  }

  const data =
    state.data || {};

  const metrics =
    data.metrics || {};

  const recentOrders =
    Array.isArray(
      data.recentOrders
    )
      ? data.recentOrders
      : [];

  const salesOverview =
    Array.isArray(
      data.salesOverview
    )
      ? data.salesOverview
      : [];

  const CARDS = [
    {
      key: 'totalProducts',
      label: 'Total Products',
      value:
        Number(
          metrics.totalProducts
        ) || 0
    },
    {
      key: 'totalOrders',
      label: 'Total Orders',
      value:
        Number(
          metrics.totalOrders
        ) || 0
    },
    {
      key: 'totalUsers',
      label: 'Total Users',
      value:
        Number(
          metrics.totalUsers
        ) || 0
    },
    {
      key: 'pendingOrders',
      label: 'Pending Orders',
      value:
        Number(
          metrics.pendingOrders
        ) || 0
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: formatPrice(
        metrics.revenue
      )
    }
  ];

  return (
    <div className="admin-page">
      <h1 className="page-title">
        Dashboard
      </h1>

      <div className="metric-grid">
        {CARDS.map(
          ({
            key,
            label,
            value
          }) => {
            const Icon =
              ICON_BY_METRIC[
                key
              ];

            return (
              <div
                className="metric-card"
                key={key}
              >
                <span className="metric-card__icon">
                  {Icon && (
                    <Icon
                      size={22}
                    />
                  )}
                </span>

                <div>
                  <span className="metric-card__value">
                    {value}
                  </span>

                  <span className="metric-card__label">
                    {label}
                  </span>
                </div>
              </div>
            );
          }
        )}
      </div>

      <section className="panel">
        <h2>
          Sales Overview{' '}
          <span className="panel__hint">
            (last 14 days,
            excludes cancelled
            orders)
          </span>
        </h2>

        <SalesChart
          data={
            salesOverview
          }
          formatPrice={
            formatPrice
          }
        />
      </section>

      <section className="panel">
        <div className="panel__head-row">
          <h2>
            Recent Orders
          </h2>

          <Link
            to="/admin/orders"
            className="section-link"
          >
            View all
          </Link>
        </div>

        {recentOrders.length ===
        0 ? (
          <p className="admin-empty-note">
            No orders yet.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    Order ID
                  </th>
                  <th>
                    Customer
                  </th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="num">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map(
                  (order) => {
                    const id =
                      order?._id ||
                      order?.id ||
                      '';

                    const status =
                      order?.status ||
                      'Unknown';

                    return (
                      <tr
                        key={id}
                      >
                        <td>
                          <Link
                            to={`/admin/orders/${id}`}
                            className="admin-id-link"
                          >
                            #
                            {id
                              .slice(
                                -8
                              )
                              .toUpperCase()}
                          </Link>
                        </td>

                        <td>
                          {order
                            ?.user
                            ?.name ||
                            'Unknown'}
                        </td>

                        <td>
                          {formatOrderDate(
                            order?.createdAt
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-pill status-pill--${String(
                              status
                            ).toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="num">
                          {formatPrice(
                            order?.totalPrice
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}