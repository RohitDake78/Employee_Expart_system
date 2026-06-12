// ===== API CONFIG =====
const API_BASE = 'http://localhost:5000/api';

// ===== HTTP HELPERS =====
const api = {
  async request(method, endpoint, data = null) {
    const token = localStorage.getItem('token');
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.body = JSON.stringify(data);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Request failed');
      return json;
    } catch (err) {
      throw err;
    }
  },
  get: (ep) => api.request('GET', ep),
  post: (ep, data) => api.request('POST', ep, data),
  put: (ep, data) => api.request('PUT', ep, data),
  delete: (ep) => api.request('DELETE', ep),
};

// ===== AUTH HELPERS =====
const auth = {
  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  getToken() { return localStorage.getItem('token'); },
  isLoggedIn() { return !!this.getToken(); },
  isManager() { return this.getUser()?.role === 'manager'; },
  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  _base() {
    // Works whether served via localhost or file://
    const l = window.location;
    if (l.protocol === 'file:') {
      // opened directly — figure out path to pages folder
      const path = l.pathname.replace(/\/[^/]+$/, '');
      return 'file://' + path;
    }
    return l.protocol + '//' + l.host + '/pages';
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = this._base() + '/login.html';
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = this._base() + '/login.html';
      return false;
    }
    return true;
  },
  requireManager() {
    if (!this.isManager()) {
      window.location.href = this._base() + '/employee-dashboard.html';
      return false;
    }
    return true;
  },
};

// ===== UI HELPERS =====
const ui = {
  // Toast notifications
  toast(message, type = 'default', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const icons = { success: '✓', error: '✕', warning: '⚠', default: 'ℹ' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.default}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = '0.3s ease'; setTimeout(() => toast.remove(), 300); }, duration);
  },

  // Show/hide modal
  showModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('show'); document.body.style.overflow = 'hidden'; }
  },
  hideModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('show'); document.body.style.overflow = ''; }
  },

  // Loading state on buttons
  setLoading(btn, loading) {
    if (loading) { btn.dataset.originalText = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></div> Loading...'; }
    else { btn.disabled = false; btn.innerHTML = btn.dataset.originalText || 'Submit'; }
  },

  // Format date
  formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  // Days until deadline
  daysLeft(deadline) {
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `<span style="color:var(--danger)">${Math.abs(days)}d overdue</span>`;
    if (days === 0) return `<span style="color:var(--warning)">Due today</span>`;
    if (days <= 3) return `<span style="color:var(--warning)">${days}d left</span>`;
    return `<span style="color:var(--text-secondary)">${days}d left</span>`;
  },

  // Priority badge
  priorityBadge(p) { return `<span class="badge badge-${p}">${p.charAt(0).toUpperCase()+p.slice(1)}</span>`; },

  // Status badge
  statusBadge(s) {
    const labels = { 'pending': 'Pending', 'in-progress': 'In Progress', 'completed': 'Completed', 'overdue': 'Overdue' };
    return `<span class="badge badge-${s}">${labels[s] || s}</span>`;
  },

  // Progress bar color
  progressColor(p) { if (p >= 75) return 'success'; if (p >= 40) return ''; return 'warning'; },

  // Avatar initials + color
  avatarColor(name) {
    const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#be185d'];
    const idx = name?.charCodeAt(0) % colors.length || 0;
    return colors[idx];
  },
  initials(name) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'; },
  avatarHtml(name, size = '') { return `<div class="avatar ${size}" style="background:${this.avatarColor(name)}">${this.initials(name)}</div>`; },

  // Dark mode toggle
  initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  },
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
  },
};

// ===== SIDEBAR SETUP =====
function setupSidebar(role) {
  const user = auth.getUser();
  if (!user) return;

  // Fill user info
  document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.sidebar-user-role').forEach(el => el.textContent = user.role);
  document.querySelectorAll('.sidebar-avatar-wrap').forEach(el => el.innerHTML = ui.avatarHtml(user.name));

  // Logout
  document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', auth.logout.bind(auth)));

  // Active nav
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    if (path.includes(item.dataset.page)) item.classList.add('active');
  });

  // Mobile toggle
  const menuBtn = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  ui.initTheme();
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) toggleBtn.addEventListener('click', ui.toggleTheme.bind(ui));
});
