import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  image_url: string;
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data));
  }, [id]);

  const addToCart = async () => {
    setLoading(true);
    try {
      await api.post('/cart/add', { productId: id, quantity });
      alert('Added to cart!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding to cart');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-8">
      <img src={product.image_url} alt={product.name} className="w-full md:w-1/2 h-96 object-cover rounded" />
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-gray-600 mb-6">{product.description}</p>
        <div className="text-2xl font-bold text-blue-600 mb-6">${product.price}</div>
        <div className="mb-6 text-gray-500">Stock: {product.stock}</div>
        <div className="flex items-center gap-4 mb-6">
          <input 
            type="number" 
            value={quantity} 
            onChange={e => setQuantity(parseInt(e.target.value))} 
            min="1" 
            max={product.stock}
            className="border p-2 w-20 rounded"
          />
          <button 
            onClick={addToCart} 
            disabled={loading || product.stock === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
