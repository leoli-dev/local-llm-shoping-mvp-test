import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Order } from '../api/types';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Order>(`/api/orders/${id}`)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Order not found');
        setLoading(false);
      });
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      const data = await apiRequest<Order>(`/api/orders/${id}/cancel`, { method: 'POST' });
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="container loading">Loading order...</div>;
  if (!order) return <div className="container error-message">{error}</div>;

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="container">
      <button onClick={() => navigate('/orders')} className="btn btn-secondary">&larr; Back to Orders</button>

      <div className="order-detail">
        <div className="order-detail-header">
          <h1>Order #{order.id}</h1>
          <span className={`status-badge ${statusColor(order.status)}`}>
            {order.status.toUpperCase()}
          </span>
        </div>

        <p className="order-date">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>

        <div className="order-items">
          {order.items.map((item) => (
            <div key={item.id} className="order-item">
              <div className="order-item-info">
                <h3>{item.productName}</h3>
                <p>${item.productPrice.toFixed(2)} x {item.quantity}</p>
              </div>
              <p className="order-item-total">${(item.productPrice * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="order-total">
          <span>Total:</span>
          <span className="total-amount">${order.totalPrice.toFixed(2)}</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {order.status === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn btn-danger"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );
}
