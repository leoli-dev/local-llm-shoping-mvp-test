import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';

// ─── Pages ──────────────────────────────────────────────────────────────────

function LoginPage({ onNext }: { onNext: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      onNext();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button type="submit" className="btn-primary">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </div>
  );
}

function RegisterPage({ onNext }: { onNext: () => void }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      onNext();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <label>Username<input type="text" value={username} onChange={e => setUsername(e.target.value)} required minLength={2} /></label>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></label>
        <button type="submit" className="btn-primary">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('./api').then(({ api }) =>
      api.products.list({ page, search })
    ).then(({ products: p, pagination: pag }) => {
      setProducts(p);
      setPagination(pag);
      setLoading(false);
    }).catch(console.error);
  }, [page, search]);

  return (
    <div className="products-page">
      <h1>Products</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      {loading ? <p>Loading...</p> : (
        <>
          <div className="product-grid">
            {products.map(p => (
              <Link to={`/products/${p.id}`} key={p.id} className="product-card">
                <img src={p.image_url} alt={p.name} />
                <h3>{p.name}</h3>
                <p className="price">¥{(p.price / 100).toFixed(2)}</p>
                <p className="stock">{p.stock > 0 ? `In stock (${p.stock})` : 'Out of stock'}</p>
              </Link>
            ))}
          </div>
          {pagination && pagination.total_pages > 1 && (
            <div className="pagination">
              {Array.from({ length: pagination.total_pages }, (_, i) => (
                <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductDetailPage({ productId, onAddToCart }: { productId: string; onAddToCart: (id: number) => void }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('./api').then(({ api }) =>
      api.products.get(parseInt(productId))
    ).then(({ product: p }) => { setProduct(p); setLoading(false); }).catch(console.error);
  }, [productId]);

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found.</p>;

  return (
    <div className="product-detail">
      <img src={product.image_url} alt={product.name} />
      <div>
        {product.category && <span className="badge">{product.category}</span>}
        <h1>{product.name}</h1>
        <p className="price-large">¥{(product.price / 100).toFixed(2)}</p>
        <p>{product.description}</p>
        <p className="stock">{product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}</p>
        <button
          className="btn-primary"
          disabled={product.stock === 0}
          onClick={() => onAddToCart(product.id)}
        >
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}

function CartPage({ onUpdateQty, onRemove, onCheckout }: { onUpdateQty: (cartId: number, qty: number) => void; onRemove: (cartId: number) => void; onCheckout: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const refresh = () => {
    import('./api').then(({ api }) =>
      api.cart.get()
    ).then(({ items: i, total_amount: t }) => { setItems(i); setTotal(t); }).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {items.map(item => (
            <div key={item.cart_id} className="cart-item">
              <img src={item.product_image} alt={item.product_name} />
              <div>
                <h3>{item.product_name}</h3>
                <p className="price">¥{(item.unit_price / 100).toFixed(2)}</p>
              </div>
              <div className="cart-item-actions">
                <button onClick={() => onUpdateQty(item.cart_id, Math.max(1, item.quantity - 1))}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.cart_id, item.quantity + 1)}>+</button>
                <span className="subtotal">¥{(item.subtotal / 100).toFixed(2)}</span>
                <button className="btn-danger" onClick={() => { onRemove(item.cart_id); refresh(); }}>✕</button>
              </div>
            </div>
          ))}
          <div className="cart-total">Total: ¥{(total / 100).toFixed(2)}</div>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={onCheckout}>Proceed to Checkout</button>
        </>
      )}
    </div>
  );
}

function CheckoutPage({ onSuccess }: { onSuccess: () => void }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);

  const handleCheckout = async () => {
    setMessage('Processing...');
    setError('');
    try {
      const { api } = await import('./api');
      const data = await api.orders.create();
      setMessage('Order placed successfully!');
      setOrderId(data.order.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      {!orderId ? (
        <>
          <p>Review your order and click below to place it.</p>
          {error && <div className="error-banner">{error}</div>}
          {message && <p>{message}</p>}
          <button className="btn-primary" onClick={handleCheckout}>Place Order</button>
        </>
      ) : (
        <>
          <div className="success-banner">✅ Order #{orderId} placed!</div>
          <button className="btn-primary" onClick={onSuccess}>View Orders</button>
        </>
      )}
    </div>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    import('./api').then(({ api }) =>
      api.orders.list()
    ).then(({ orders: o }) => setOrders(o)).catch(console.error);
  }, []);

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map(o => (
          <div key={o.id} className="order-summary">
            <Link to={`/orders/${o.id}`}>
              <h3>Order #{o.id}</h3>
              <p>Status: <span className={`status ${o.status}`}>{o.status}</span></p>
              <p>Total: ¥{(o.total_amount / 100).toFixed(2)}</p>
              <p>Date: {new Date(o.created_at).toLocaleString()}</p>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

function OrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);
  const [cancelMsg, setCancelMsg] = useState('');

  useEffect(() => {
    import('./api').then(({ api }) =>
      api.orders.get(parseInt(orderId))
    ).then(({ order: o }) => setOrder(o)).catch(console.error);
  }, [orderId]);

  const handleCancel = async () => {
    try {
      const { api } = await import('./api');
      await api.orders.cancel(parseInt(orderId));
      setCancelMsg('Order cancelled.');
      setOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
    } catch (err: any) {
      setCancelMsg(err.message);
    }
  };

  if (!order) return <p>Loading...</p>;

  return (
    <div className="order-detail">
      <h1>Order #{order.id}</h1>
      <p>Status: <span className={`status ${order.status}`}>{order.status}</span></p>
      <p>Date: {new Date(order.created_at).toLocaleString()}</p>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
        <tbody>
          {order.items.map((item: any) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td>{item.quantity}</td>
              <td>¥{(item.unit_price / 100).toFixed(2)}</td>
              <td>¥{(item.subtotal / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="order-total">Total: ¥{(order.total_amount / 100).toFixed(2)}</div>
      {order.status === 'pending' && (
        <button className="btn-danger" onClick={handleCancel}>Cancel Order</button>
      )}
      {cancelMsg && <p className="error-banner">{cancelMsg}</p>}
    </div>
  );
}

// ─── Protected Route ────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

// ─── App Layout ─────────────────────────────────────────────────────────────

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = () => {
    if (!isAuthenticated) return;
    import('./api').then(({ api }) =>
      api.cart.get()
    ).then(({ item_count: c }) => setCartCount(c)).catch(() => {});
  };

  useEffect(() => { refreshCartCount(); }, [isAuthenticated]);

  const handleAddToCart = async (productId: number) => {
    try {
      const { api } = await import('./api');
      await api.cart.addItem({ product_id: productId });
      refreshCartCount();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateQty = async (cartId: number, qty: number) => {
    try {
      const { api } = await import('./api');
      await api.cart.updateItem(cartId, qty);
      refreshCartCount();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveItem = async (cartId: number) => {
    try {
      const { api } = await import('./api');
      await api.cart.removeItem(cartId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">🛒 ShopMVP</Link>
        <div className="nav-links">
          <Link to="/">Products</Link>
          {isAuthenticated && (
            <>
              <Link to="/cart" style={{ position: 'relative' }}>
                Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/orders">Orders</Link>
              <span className="user-name">{user?.username}</span>
              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          )}
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage onNext={() => (window.location.href = '/')} />} />
          <Route path="/register" element={<RegisterPage onNext={() => (window.location.href = '/')} />} />
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage productId={window.location.pathname.split('/').pop() || ''} onAddToCart={handleAddToCart} />} />
          <Route path="/cart" element={
            <ProtectedRoute>
              <CartPage onUpdateQty={handleUpdateQty} onRemove={handleRemoveItem} onCheckout={() => (window.location.href = '/checkout')} />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutPage onSuccess={() => (window.location.href = '/orders')} />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrdersPage /></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute>
              <OrderDetailPage orderId={window.location.pathname.split('/').pop() || ''} />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
