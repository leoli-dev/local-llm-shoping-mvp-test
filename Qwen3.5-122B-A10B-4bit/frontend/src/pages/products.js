import { api } from '../api.js';

export const productPages = [
  {
    path: '#/',
    template: (app) => `
      <div class="page">
        <header class="header">
          <h1><a href="#/" class="logo">ShopMVP</a></h1>
          <nav class="nav">
            ${app.user ? `
              <span class="user-info">Hello, ${app.user.username}</span>
              <a href="#/cart">Cart <span id="cart-count" class="cart-count"></span></a>
              <a href="#/orders">Orders</a>
              <a href="#/logout" class="btn btn-outline">Logout</a>
            ` : `
              <a href="#/login" class="btn btn-primary">Login</a>
              <a href="#/register" class="btn btn-outline">Register</a>
            `}
          </nav>
        </header>

        <main class="main">
          <div class="filters">
            <input type="text" id="search" placeholder="Search products..." class="search-input">
            <select id="category" class="category-filter">
              <option value="">All Categories</option>
            </select>
          </div>

          <div id="product-grid" class="product-grid"></div>

          <div id="pagination" class="pagination"></div>
        </main>
      </div>
    `,
    onMount: async (app) => {
      if (!app.user) {
        try {
          const data = await api.auth.me();
          app.setAuth(data, localStorage.getItem('token'));
        } catch {
          // Guest user
        }
      }

      let currentPage = 1;
      let search = '';
      let category = '';
      let productsData = null;

      const render = async () => {
        try {
          productsData = await api.products.list({ page: currentPage, limit: 6, search, category });

          const grid = document.getElementById('product-grid');
          grid.innerHTML = productsData.products.map(p => `
            <div class="product-card">
              <img src="${p.image}" alt="${p.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
              <div class="product-info">
                <h3>${p.name}</h3>
                <p class="product-desc">${p.description}</p>
                <div class="product-meta">
                  <span class="product-price">$${p.price.toFixed(2)}</span>
                  <span class="product-stock">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
                </div>
                <a href="#/product/${p.id}" class="btn btn-secondary">View Details</a>
              </div>
            </div>
          `).join('');

          const categories = await api.products.categories();
          const categorySelect = document.getElementById('category');
          if (categorySelect.options.length === 1) {
            categories.categories.forEach(cat => {
              const option = document.createElement('option');
              option.value = cat;
              option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
              categorySelect.appendChild(option);
            });
          }

          const totalPages = productsData.pagination.totalPages;
          const pagination = document.getElementById('pagination');
          pagination.innerHTML = `
            <button class="btn btn-sm" ${currentPage === 1 ? 'disabled' : ''} onclick="window.loadPage(${currentPage - 1})">Prev</button>
            <span class="page-info">Page ${currentPage} of ${totalPages}</span>
            <button class="btn btn-sm" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.loadPage(${currentPage + 1})">Next</button>
          `;
        } catch (err) {
          document.getElementById('product-grid').innerHTML = `<p class="error">Failed to load products: ${err.message}</p>`;
        }
      };

      window.loadPage = (page) => {
        currentPage = page;
        render();
      };

      document.getElementById('search').addEventListener('input', (e) => {
        search = e.target.value;
        currentPage = 1;
        render();
      });

      document.getElementById('category').addEventListener('change', (e) => {
        category = e.target.value;
        currentPage = 1;
        render();
      });

      await render();

      if (app.user) {
        try {
          const cart = await api.cart.get();
          const count = document.getElementById('cart-count');
          if (count) count.textContent = `(${cart.items.length})`;
        } catch {}

        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            app.logout();
          });
        }
      }
    }
  },
  {
    path: '#/product/:id',
    template: () => `
      <div class="page">
        <header class="header">
          <h1><a href="#/" class="logo">ShopMVP</a></h1>
          <nav class="nav">
            <a href="#/">&larr; Back to Products</a>
          </nav>
        </header>

        <main class="main">
          <div id="product-detail" class="product-detail"></div>
        </main>
      </div>
    `,
    onMount: async (app) => {
      const id = window.location.hash.split('/')[2];
      const container = document.getElementById('product-detail');

      try {
        const product = await api.products.detail(id);

        container.innerHTML = `
          <div class="product-detail-content">
            <img src="${product.image}" alt="${product.name}" class="product-detail-image" onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'">
            <div class="product-detail-info">
              <span class="product-category">${product.category}</span>
              <h1>${product.name}</h1>
              <p class="product-detail-desc">${product.description}</p>
              <div class="product-detail-meta">
                <span class="product-price-large">$${product.price.toFixed(2)}</span>
                <span class="product-stock">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
              </div>
              ${app.user
                ? `<div class="add-to-cart">
                     <label for="quantity">Quantity:</label>
                     <input type="number" id="quantity" value="1" min="1" max="${product.stock}" class="quantity-input">
                     <button id="add-to-cart" class="btn btn-primary ${product.stock === 0 ? 'disabled' : ''}" ${product.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
                   </div>`
                : '<p><a href="#/login" class="btn btn-primary">Login to add to cart</a></p>'
              }
            </div>
          </div>
        `;

        if (app.user && product.stock > 0) {
          document.getElementById('add-to-cart').addEventListener('click', async () => {
            const quantity = parseInt(document.getElementById('quantity').value);
            try {
              await api.cart.addItem({ productId: product.id, quantity });
              alert('Added to cart!');
            } catch (err) {
              alert(err.message);
            }
          });
        }
      } catch (err) {
        container.innerHTML = `<p class="error">Failed to load product: ${err.message}</p>`;
      }
    }
  }
];
