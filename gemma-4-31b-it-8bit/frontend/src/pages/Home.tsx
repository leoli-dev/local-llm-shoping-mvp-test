import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
}

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api.get(`/products?page=${page}`).then(res => {
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
    });
  }, [page]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover rounded mb-4" />
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="text-gray-600 mb-2">{p.description.substring(0, 60)}...</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-blue-600">${p.price}</span>
              <Link to={`/product/${p.id}`} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">View Detail</Link>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-8">
        <button 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
          className="px-4 py-2 bg-white border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="py-2">Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages} 
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 bg-white border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Home;
