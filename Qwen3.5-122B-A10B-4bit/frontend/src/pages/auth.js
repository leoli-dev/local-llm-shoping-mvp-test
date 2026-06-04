import { api } from '../api.js';

export const authPages = [
  {
    path: '#/login',
    template: () => `
      <div class="page auth-page">
        <h1>Login</h1>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <div id="error" class="error-message"></div>
          <button type="submit" class="btn btn-primary">Login</button>
        </form>
        <p class="auth-link">Don't have an account? <a href="#/register">Register</a></p>
      </div>
    `,
    onMount: (app) => {
      const form = document.getElementById('login-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('error');
        const formData = new FormData(form);
        try {
          const data = await api.auth.login({
            email: formData.get('email'),
            password: formData.get('password')
          });
          app.setAuth(data.user, data.token);
          window.location.hash = '#/';
        } catch (err) {
          if (errorEl) errorEl.textContent = err.message;
        }
      });
    }
  },
  {
    path: '#/register',
    template: () => `
      <div class="page auth-page">
        <h1>Register</h1>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password (min 6 characters)</label>
            <input type="password" id="password" name="password" required minlength="6">
          </div>
          <div id="error" class="error-message"></div>
          <button type="submit" class="btn btn-primary">Register</button>
        </form>
        <p class="auth-link">Already have an account? <a href="#/login">Login</a></p>
      </div>
    `,
    onMount: (app) => {
      const form = document.getElementById('register-form');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('error');
        const formData = new FormData(form);
        try {
          const data = await api.auth.register({
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
          });
          app.setAuth(data.user, data.token);
          window.location.hash = '#/';
        } catch (err) {
          if (errorEl) errorEl.textContent = err.message;
        }
      });
    }
  }
];
