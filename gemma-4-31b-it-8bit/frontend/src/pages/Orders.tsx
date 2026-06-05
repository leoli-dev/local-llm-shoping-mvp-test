import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
}

interface OrderDetail extends Order {
  items: Array<{
    product_id: number;
    quantity: number;
    price_at_purchase: number;
    name: string;
  }>;
}

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data));
  }, []);

  if (orders.length === 0) return <div className="text-center mt-10">You have no orders yet.</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(o => (
          <div key={o.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">Order #{o.id}</div>
              <div className="text-sm text-gray-500">{o.created_at}</div>
              <div className="text-blue-600 font-semibold mt-1">Status: {o.status}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold mb-2">${o.total_amount.toFixed(2)}</div>
              <Link to={`/orders/${o.id}`} className="text-blue-600 hover:underline text-sm">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
