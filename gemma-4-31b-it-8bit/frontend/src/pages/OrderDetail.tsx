import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

interface OrderDetail {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setLoading(true);
    try {
      await api.post(`/orders/cancel/${id}`);
      alert('Order cancelled successfully');
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error cancelling order');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/orders" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Orders</Link>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Order Details #{order.id}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'pending' ? 'bg-blue-100 text-blue-800' : 
            order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {order.status}
          </span>
        </div>
        <div className="text-gray-600 mb-6">Date: {order.created_at}</div>
        <table className="w-full text-left mb-6">
          <thead className="border-b">
            <tr>
              <th className="py-2">Product</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Price</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3">{item.product_name}</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3">${item.price_at_purchase}</td>
                <td className="py-3 text-right">${(item.quantity * item.price_at_purchase).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table >
        <div className="flex justify-end items-center gap-4 mb-6">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-2xl font-bold text-blue-600">${order.total_amount.toFixed(2)}</span>
        </div >
        {order.status === 'pending' && (
          <button 
            onClick={handleCancel}
            disabled={loading}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 disabled:bg-gray-400 transition"
          >
            {loading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div >
    </div >
  );
}

export default OrderDetail;
