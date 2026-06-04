import { router } from './router.js';

export class App {
  constructor() {
    this.currentRoute = null;
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.token = localStorage.getItem('token') || null;
  }

  init() {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }

  setAuth(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.hash = '#/';
  }

  render() {
    const app = document.getElementById('app');
    const currentHash = window.location.hash || '#/';
    const route = router.match(currentHash);

    if (route) {
      this.currentRoute = route;
      app.innerHTML = route.template(this);
      route.onMount?.(this);
    }
  }
}
