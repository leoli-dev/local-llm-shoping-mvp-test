import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Product, Cart } from '../api/types';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiRequest<Product>(`/api/products/${id}`)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Product not found');
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    setError('');
    setSuccess('');

    const tokens = localStorage.getItem('tokens');
    if (!tokens) {
      navigate('/login');
      return;
    }

    try {
      await apiRequest<Cart>('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: product!.id, quantity })
      });
      setSuccess(`Added ${quantity}x ${product!.name} to cart!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  if (loading) return <div className="container loading">Loading...</div>;
  if (!product) return <div className="container error-message">{error}</div>;

  return (
    <div className="container">
      <div className="product-detail">
        <div className="product-detail-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="product-image-placeholder">No image</div>
          )}
        </div>
        <div className="product-detail-info">
          <span className="category-badge">{product.category.name}</span>
          <h1>{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <div className="product-detail-price">${product.price.toFixed(2)}</div>
          <div className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>

          {product.stock > 0 && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span className="quantity-value">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
              </div>
              <button onClick={handleAddToCart} className="btn btn-primary btn-large">
                Add to Cart
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
      </div>
    </div>
  );
}
