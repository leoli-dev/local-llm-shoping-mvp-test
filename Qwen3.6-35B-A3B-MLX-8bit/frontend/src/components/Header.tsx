import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiRequest, logout } from '../api/client';
import type { Cart } from '../api/types';

export function Header() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        const parsed = JSON.parse(tokens);
        // Decode JWT payload (URL-safe base64) to get username
        const b64 = parsed.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
        setUsername(payload.username || '');

        // Fetch cart count
        apiRequest<Cart>('/api/cart')
          .then((cart) => {
            setCartCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
          })
          .catch(() => {});
      } catch {
        // Invalid token, will be handled on API calls
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    setCartCount(0);
    setUsername('');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">ShopMVP</Link>
        <nav className="nav">
          <Link to="/">Products</Link>
          {username && (
            <>
              <Link to="/cart">
                Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/orders">Orders</Link>
            </>
          )}
        </nav>
        <div className="header-right">
          {username ? (
            <>
              <span className="user-name">{username}</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
