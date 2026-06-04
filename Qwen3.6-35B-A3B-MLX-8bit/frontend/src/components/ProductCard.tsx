import { Link } from 'react-router-dom';
import type { Product } from '../api/types';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-image-placeholder">No image</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-category">{product.category.name}</p>
        <div className="product-bottom">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {product.stock > 0 ? (
            <span className="in-stock">In Stock</span>
          ) : (
            <span className="out-of-stock">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
