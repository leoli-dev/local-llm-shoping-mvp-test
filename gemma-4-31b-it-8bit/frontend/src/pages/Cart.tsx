import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string;
}

function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/cart').then(res => {
      setItems(res.data.items);
      setTotal(res.data.total);
    });
  }, []);

  const updateQuantity = async (productId: number, quantity: number) => {
    try {
      await api.put('/cart/update', { productId, quantity });
      const res = await api.get('/cart');
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating quantity');
    }
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/orders');
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return <div className="text-center mt-10">Your cart is empty. <Link to="/" className="text-blue-600 underline">Go shopping!</Link></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Price</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-4 flex items-center gap-4">
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  <span className="font-medium">{item.name}</span>
                </td>
                <td className="p-4">${item.price}</td>
                <td className="p-4">
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={e => updateQuantity(item.product_id, parseInt(e.target.value))}
                    className="border p-1 w-16 rounded"
                    min="1"
                  />
                </td>
                <td className="p-4 font-semibold">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-6 bg-gray-50 flex justify-between items-center">
          <div className="text-2xl font-bold">Total: ${total.toFixed(2)}</div>
          <button 
            onClick={placeOrder} 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
export default Cart;
