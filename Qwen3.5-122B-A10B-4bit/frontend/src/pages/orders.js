import { api } from '../api.js';

export const orderPages = [
  {
    path: '#/orders',
    template: (app) => `
      <div class="page">
        <header class="header">
          <h1><a href="#/" class="logo">ShopMVP</a></h1>
          <nav class="nav">
            ${app.user
              ? `
              <span class="user-info">Hello, ${app.user.username}</span>
              <a href="#/cart">Cart <span id="cart-count" class="cart-count"></span></a>
              <a href="#/orders">Orders</a>
              <a href="#/logout" class="btn btn-outline">Logout</a>
            `
              : `
              <a href="#/login" class="btn btn-primary">Login</a>
              <a href="#/register" class="btn btn-outline">Register</a>
            `}
          </nav>
        </header>

        <main class="main">
          <h1>My Orders</h1>
          <div id="orders-list" class="orders-list"></div>
        </main>
      </div>
    `,
    onMount: async (app) => {
      if (!app.user) {
        window.location.hash = '#/login';
        return;
      }

      const container = document.getElementById('orders-list');

      try {
        const orders = await api.orders.list();

        if (orders.length === 0) {
          container.innerHTML = `
            <div class="empty-orders">
              <p>You haven't placed any orders yet</p>
              <a href="#/" class="btn btn-primary">Start Shopping</a>
            </div>
          `;
          return;
        }

        container.innerHTML = orders.map(order => `
          <div class="order-card">
            <div class="order-header">
              <span class="order-id">Order #${order.id}</span>
              <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-date">${new Date(order.createdAt).toLocaleDateString()}</div>
            <div class="order-items">
              ${order.items.map(item => `
                <div class="order-item">
                  <span>${item.product.name}</span>
                  <span>${item.quantity} x $${item.price.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="order-total">
              <span>Total:</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
            <a href="#/order/${order.id}" class="btn btn-secondary">View Details</a>
          </div>
        `).join('');

        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => app.logout());
        }
      } catch (err) {
        container.innerHTML = `<p class="error">Failed to load orders: ${err.message}</p>`;
      }
    }
  },
  {
    path: '#/order/:id',
    template: (app) => `
      <div class="page">
        <header class="header">
          <h1><a href="#/" class="logo">ShopMVP</a></h1>
          <nav class="nav">
            ${app.user
              ? `
              <span class="user-info">Hello, ${app.user.username}</span>
              <a href="#/cart">Cart</a>
              <a href="#/orders">Orders</a>
              <a href="#/logout" class="btn btn-outline">Logout</a>
            `
              : `
              <a href="#/login" class="btn btn-primary">Login</a>
              <a href="#/register" class="btn btn-outline">Register</a>
            `}
          </nav>
        </header>

        <main class="main">
          <a href="#/orders" class="back-link">&larr; Back to Orders</a>
          <div id="order-detail" class="order-detail"></div>
        </main>
      </div>
    `,
    onMount: async (app) => {
      if (!app.user) {
        window.location.hash = '#/login';
        return;
      }

      const id = window.location.hash.split('/')[2];
      const container = document.getElementById('order-detail');

      try {
        const order = await api.orders.detail(id);

        let actionButtons = '';
        if (order.status === 'pending') {
          actionButtons = `<button id="cancel-order" class="btn btn-outline">Cancel Order</button>`;
        }

        container.innerHTML = `
          <div class="order-detail-content">
            <div class="order-header">
              <h1>Order #${order.id}</h1>
              <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-date">Placed on ${new Date(order.createdAt).toLocaleDateString()}</div>
            <div class="order-items">
              <h2>Order Items</h2>
              ${order.items.map(item => `
                <div class="order-item">
                  <img src="${item.product.image}" alt="${item.product.name}" class="order-item-image" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
                  <div class="order-item-info">
                    <h3>${item.product.name}</h3>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: $${item.price.toFixed(2)}</p>
                  </div>
                  <div class="order-item-total">$${(item.quantity * item.price).toFixed(2)}</div>
                </div>
              `).join('')}
            </div>
            <div class="order-summary">
              <div class="summary-total">
                <span>Total</span>
                <span>$${order.total.toFixed(2)}</span>
              </div>
              ${actionButtons}
            </div>
          </div>
        `;

        const cancelBtn = document.getElementById('cancel-order');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to cancel this order?')) {
              try {
                const result = await api.orders.cancel(id);
                alert(result.message);
                window.location.hash = '#/orders';
              } catch (err) {
                alert(err.message);
              }
            }
          });
        }

        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => app.logout());
        }
      } catch (err) {
        container.innerHTML = `<p class="error">Failed to load order: ${err.message}</p>`;
      }
    }
  }
];
