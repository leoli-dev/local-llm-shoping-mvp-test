import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Cart } from '../api/types';

export function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const fetchCart = async () => {
    try {
      const data = await apiRequest<Cart>('/api/cart');
      setCart(data);
    } catch {
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 0) return;
    try {
      const data = await apiRequest<Cart>(`/api/cart/items/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      });
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const removeItem = async (productId: number) => {
    try {
      const data = await apiRequest<Cart>(`/api/cart/items/${productId}`, { method: 'DELETE' });
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const handleCheckout = async () => {
    setError('');
    setCheckoutSuccess(false);

    try {
      await apiRequest('/api/orders', { method: 'POST' });
      setCheckoutSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  if (loading) return <div className="container loading">Loading cart...</div>;

  return (
    <div className="container">
      <h1>Shopping Cart</h1>

      {checkoutSuccess && (
        <div className="success-message">Order placed successfully! Redirecting to orders...</div>
      )}

      {error && <div className="error-message">{error}</div>}

      {cart.items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Browse Products</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-price">${item.price.toFixed(2)} each</p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                  </div>
                  <p className="cart-item-subtotal">${item.subtotal.toFixed(2)}</p>
                  <button onClick={() => removeItem(item.productId)} className="btn-remove">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total-row">
              <span>Total:</span>
              <span className="total-amount">${cart.total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} className="btn btn-primary btn-large btn-full">
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
