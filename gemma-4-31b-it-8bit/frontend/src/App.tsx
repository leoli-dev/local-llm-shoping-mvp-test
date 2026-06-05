import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import { ShoppingCart, Package } from 'lucide-react';

function App() {
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">ShopMVP</Link>
          <div className="flex gap-6 items-center">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            {token ? (
              <>
                <Link to="/cart" className="hover:text-blue-600 flex items-center gap-1">
                  <ShoppingCart size={20} /> Cart
                </Link>
                <Link to="/orders" className="hover:text-blue-600 flex items-center gap-1">
                  <Package size={20} /> Orders
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Hi, {username}</span>
                  <button onClick={logout} className="text-red-500 text-sm font-medium">Logout</button>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="hover:text-blue-600">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Register</Link>
              </div>
            )}
          </div>
        </nav>

        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
