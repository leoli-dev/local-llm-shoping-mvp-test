import { authPages } from './pages/auth.js';
import { productPages } from './pages/products.js';
import { cartPages } from './pages/cart.js';
import { orderPages } from './pages/orders.js';

const routes = [
  ...authPages,
  ...productPages,
  ...cartPages,
  ...orderPages
];

export const router = {
  match(hash) {
    // First try exact match
    let route = routes.find(r => r.path === hash);
    if (route) return route;

    // Then try dynamic routes with regex
    for (const r of routes) {
      const pattern = r.path.replace(/:\w+/g, '(\\w+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = hash.match(regex);
      if (match) {
        // Store params on the route for onMount to access
        route = { ...r, params: match.slice(1) };
        return route;
      }
    }

    return null;
  }
};
