import { api } from '../api.js';

export const cartPages = [
  {
    path: '#/cart',
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
          <h1>Shopping Cart</h1>
          <div id="cart-content" class="cart-content"></div>
        </main>
      </div>
    `,
    onMount: async (app) => {
      if (!app.user) {
        window.location.hash = '#/login';
        return;
      }

      const container = document.getElementById('cart-content');

      try {
        const cart = await api.cart.get();

        if (cart.items.length === 0) {
          container.innerHTML = `
            <div class="empty-cart">
              <p>Your cart is empty</p>
              <a href="#/" class="btn btn-primary">Continue Shopping</a>
            </div>
          `;
          return;
        }

        const updateCart = async () => {
          try {
            const cart = await api.cart.get();

            const itemsHtml = cart.items.map(item => `
              <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
                <div class="cart-item-info">
                  <h3>${item.name}</h3>
                  <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                  <button class="qty-btn" data-action="decrease" data-item-id="${item.itemId}">-</button>
                  <input type="number" value="${item.quantity}" min="0" class="qty-input" data-item-id="${item.itemId}">
                  <button class="qty-btn" data-action="increase" data-item-id="${item.itemId}">+</button>
                </div>
                <div class="cart-item-subtotal">
                  <p>$${item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            `).join('');

            container.innerHTML = `
              <div class="cart-items">
                ${itemsHtml}
              </div>
              <div class="cart-summary">
                <h2>Order Summary</h2>
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>$${cart.total.toFixed(2)}</span>
                </div>
                <div class="summary-total">
                  <span>Total</span>
                  <span>$${cart.total.toFixed(2)}</span>
                </div>
                <button id="checkout-btn" class="btn btn-primary btn-large">Proceed to Checkout</button>
              </div>
            `;

            document.querySelectorAll('.qty-btn').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const itemId = e.target.dataset.itemId;
                const input = document.querySelector(`.qty-input[data-item-id="${itemId}"]`);
                const action = e.target.dataset.action;
                const newQty = action === 'increase' ? parseInt(input.value) + 1 : Math.max(0, parseInt(input.value) - 1);
                input.value = newQty;
                await api.cart.updateItem(itemId, newQty);
                await render();
              });
            });

            document.querySelectorAll('.qty-input').forEach(input => {
              input.addEventListener('change', async (e) => {
                const itemId = e.target.dataset.itemId;
                const qty = Math.max(0, parseInt(e.target.value));
                await api.cart.updateItem(itemId, qty);
                await render();
              });
            });

            document.getElementById('checkout-btn').addEventListener('click', async () => {
              try {
                const order = await api.orders.create();
                alert('Order placed successfully!');
                window.location.hash = '#/orders';
              } catch (err) {
                alert(err.message);
              }
            });
          } catch (err) {
            container.innerHTML = `<p class="error">Failed to load cart: ${err.message}</p>`;
          }
        };

        const render = () => updateCart();
        await render();

        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => app.logout());
        }
      } catch (err) {
        container.innerHTML = `<p class="error">Failed to load cart: ${err.message}</p>`;
      }
    }
  }
];
