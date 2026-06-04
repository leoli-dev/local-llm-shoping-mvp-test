import { useState, useEffect, useCallback } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Pagination } from '../components/Pagination';
import { apiRequest } from '../api/client';
import type { ProductListResponse, Category } from '../api/types';

export function ProductList() {
  const [products, setProducts] = useState<ProductListResponse['products']>([]);
  const [pagination, setPagination] = useState<ProductListResponse['pagination']>({ page: 1, limit: 6, total: 0, totalPages: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '6' });
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);

      const data = await apiRequest<ProductListResponse>(`/api/products?${params}`);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  useEffect(() => {
    apiRequest<{ categories: Category[] }>('/api/products/categories')
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    fetchProducts(1);
  };

  return (
    <div className="container">
      <div className="product-list-header">
        <h1>Products</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select value={selectedCategory} onChange={handleCategoryChange} className="category-select">
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">No products found.</div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => fetchProducts(page)}
          />
        </>
      )}
    </div>
  );
}
