/* ─────────────────────────────────────────────────────────────
   Expense & Budget Visualizer — app.js
   Vanilla JS | LocalStorage | Chart.js 4
   Optional challenges implemented:
     1. Custom categories
     2. Monthly summary view
     3. Sort transactions (amount / category)
     4. Highlight spending over limit
     5. Dark / light mode toggle
───────────────────────────────────────────────────────────── */

// ──────────────────────── Constants ────────────────────────

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

// Accessible colour palette for chart slices
const CATEGORY_COLORS = {
  Food:      '#22c55e',
  Transport: '#3b82f6',
  Fun:       '#f97316',
};
const CUSTOM_COLOR_POOL = [
  '#a855f7', '#ec4899', '#06b6d4', '#eab308', '#14b8a6',
  '#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1',
];

// ──────────────────────── State ────────────────────────────

let transactions = [];       // { id, name, amount, category, timestamp }
let customCategories = [];   // string[]
let spendingLimit = 0;       // 0 = no limit
let sortMode = 'newest';
let chart = null;            // Chart.js instance
let monthlySummaryOpen = false;

// ──────────────────────── DOM refs ─────────────────────────

const body            = document.body;
const themeToggle     = document.getElementById('themeToggle');
const totalBalanceEl  = document.getElementById('totalBalance');
const limitWarning    = document.getElementById('limitWarning');
const spendingLimitEl = document.getElementById('spendingLimit');
const setLimitBtn     = document.getElementById('setLimitBtn');

const form            = document.getElementById('transactionForm');
const itemNameEl      = document.getElementById('itemName');
const amountEl        = document.getElementById('amount');
const categoryEl      = document.getElementById('category');
const nameError       = document.getElementById('nameError');
const amountError     = document.getElementById('amountError');
const categoryError   = document.getElementById('categoryError');

const newCategoryInput = document.getElementById('newCategoryInput');
const addCategoryBtn   = document.getElementById('addCategoryBtn');
const catAddError      = document.getElementById('catAddError');

const sortSelect        = document.getElementById('sortSelect');
const monthlySummaryBtn = document.getElementById('monthlySummaryBtn');
const monthlySummaryEl  = document.getElementById('monthlySummary');
const transactionList   = document.getElementById('transactionList');
const emptyState        = document.getElementById('emptyState');
const chartCanvas       = document.getElementById('spendingChart');

// ──────────────────────── LocalStorage helpers ─────────────

const LS_KEYS = {
  transactions:      'ebv_transactions',
  customCategories:  'ebv_custom_categories',
  spendingLimit:     'ebv_spending_limit',
  sortMode:          'ebv_sort_mode',
  theme:             'ebv_theme',
};

function save() {
  localStorage.setItem(LS_KEYS.transactions,     JSON.stringify(transactions));
  localStorage.setItem(LS_KEYS.customCategories, JSON.stringify(customCategories));
  localStorage.setItem(LS_KEYS.spendingLimit,    String(spendingLimit));
  localStorage.setItem(LS_KEYS.sortMode,         sortMode);
}

function load() {
  try {
    const t  = localStorage.getItem(LS_KEYS.transactions);
    const cc = localStorage.getItem(LS_KEYS.customCategories);
    const sl = localStorage.getItem(LS_KEYS.spendingLimit);
    const sm = localStorage.getItem(LS_KEYS.sortMode);
    const th = localStorage.getItem(LS_KEYS.theme);

    if (t)  transactions     = JSON.parse(t);
    if (cc) customCategories = JSON.parse(cc);
    if (sl) spendingLimit    = parseFloat(sl) || 0;
    if (sm) sortMode         = sm;
    if (th) body.setAttribute('data-theme', th);
  } catch (e) {
    console.error('Failed to load from LocalStorage:', e);
  }
}

// ──────────────────────── Unique ID ────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ──────────────────────── Theme ────────────────────────────

function applyTheme() {
  const isDark = body.getAttribute('data-theme') === 'dark';
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

themeToggle.addEventListener('click', () => {
  const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
  localStorage.setItem(LS_KEYS.theme, next);
  applyTheme();
  rebuildChart(); // chart colours need refresh
});

// ──────────────────────── Category management ──────────────

function getCategoryColor(cat) {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  // Deterministic colour from pool based on category name
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % CUSTOM_COLOR_POOL.length;
  return CUSTOM_COLOR_POOL[idx];
}

function getCategoryBadgeClass(cat) {
  if (cat === 'Food')      return 'badge-Food';
  if (cat === 'Transport') return 'badge-Transport';
  if (cat === 'Fun')       return 'badge-Fun';
  return 'badge-custom';
}

function buildCategoryOptions() {
  // Remove all options except placeholder
  while (categoryEl.options.length > 1) categoryEl.remove(1);

  const all = [...DEFAULT_CATEGORIES, ...customCategories];
  all.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryEl.appendChild(opt);
  });
}

addCategoryBtn.addEventListener('click', () => {
  const raw = newCategoryInput.value.trim();
  catAddError.textContent = '';

  if (!raw) {
    catAddError.textContent = 'Please enter a category name.';
    return;
  }

  const all = [...DEFAULT_CATEGORIES, ...customCategories];
  if (all.some(c => c.toLowerCase() === raw.toLowerCase())) {
    catAddError.textContent = 'Category already exists.';
    return;
  }

  customCategories.push(raw);
  buildCategoryOptions();
  newCategoryInput.value = '';
  save();

  // Select the newly added category
  categoryEl.value = raw;
});

// ──────────────────────── Validation ───────────────────────

function clearErrors() {
  nameError.textContent     = '';
  amountError.textContent   = '';
  categoryError.textContent = '';
  itemNameEl.classList.remove('invalid');
  amountEl.classList.remove('invalid');
  categoryEl.classList.remove('invalid');
}

function validate(name, amount, category) {
  let valid = true;

  if (!name) {
    nameError.textContent = 'Item name is required.';
    itemNameEl.classList.add('invalid');
    valid = false;
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    amountError.textContent = 'Enter a valid amount greater than 0.';
    amountEl.classList.add('invalid');
    valid = false;
  }

  if (!category) {
    categoryError.textContent = 'Please select a category.';
    categoryEl.classList.add('invalid');
    valid = false;
  }

  return valid;
}

// ──────────────────────── Form submit ──────────────────────

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();

  const name     = itemNameEl.value.trim();
  const amount   = amountEl.value.trim();
  const category = categoryEl.value;

  if (!validate(name, amount, category)) return;

  const transaction = {
    id:        uid(),
    name,
    amount:    parseFloat(parseFloat(amount).toFixed(2)),
    category,
    timestamp: Date.now(),
  };

  transactions.unshift(transaction);
  save();
  renderAll();

  // Reset form
  itemNameEl.value = '';
  amountEl.value   = '';
  categoryEl.value = '';
  itemNameEl.focus();
});

// ──────────────────────── Delete ───────────────────────────

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save();
  renderAll();
}

// ──────────────────────── Sorting ──────────────────────────

function getSorted() {
  const list = [...transactions];
  switch (sortMode) {
    case 'newest':      return list.sort((a, b) => b.timestamp - a.timestamp);
    case 'oldest':      return list.sort((a, b) => a.timestamp - b.timestamp);
    case 'amount-desc': return list.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':  return list.sort((a, b) => a.amount - b.amount);
    case 'category':    return list.sort((a, b) => a.category.localeCompare(b.category));
    default:            return list;
  }
}

sortSelect.value = sortMode;
sortSelect.addEventListener('change', () => {
  sortMode = sortSelect.value;
  save();
  renderTransactions();
});

// ──────────────────────── Total Balance ────────────────────

function getTotalSpending() {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

function renderBalance() {
  const total = getTotalSpending();
  totalBalanceEl.textContent = formatCurrency(total);

  const isOver = spendingLimit > 0 && total > spendingLimit;
  totalBalanceEl.classList.toggle('over-limit', isOver);
  limitWarning.classList.toggle('hidden', !isOver);
}

// ──────────────────────── Transaction list ─────────────────

function formatCurrency(val) {
  return '$' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function renderTransactions() {
  const sorted = getSorted();
  const total  = getTotalSpending();
  const isOver = spendingLimit > 0 && total > spendingLimit;

  // Toggle empty state
  emptyState.classList.toggle('hidden', sorted.length > 0);

  // Remove existing items (keep emptyState)
  const items = transactionList.querySelectorAll('.transaction-item');
  items.forEach(el => el.remove());

  sorted.forEach(t => {
    const li = document.createElement('li');
    li.className = 'transaction-item' + (isOver ? ' over-limit-item' : '');
    li.dataset.id = t.id;

    li.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
        <span class="transaction-amount${isOver ? ' over-limit' : ''}">${formatCurrency(t.amount)}</span>
        <span class="category-badge ${getCategoryBadgeClass(t.category)}">${escapeHtml(t.category)}</span>
      </div>
      <button
        class="btn btn-danger"
        aria-label="Delete transaction ${escapeHtml(t.name)}"
        data-id="${t.id}"
      >Delete</button>
    `;

    transactionList.appendChild(li);
  });
}

// Delegate delete clicks on the list
transactionList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id]');
  if (btn) deleteTransaction(btn.dataset.id);
});

// ──────────────────────── Monthly Summary ──────────────────

monthlySummaryBtn.addEventListener('click', () => {
  monthlySummaryOpen = !monthlySummaryOpen;
  monthlySummaryEl.classList.toggle('hidden', !monthlySummaryOpen);
  monthlySummaryBtn.textContent = monthlySummaryOpen ? '📅 Hide Summary' : '📅 Monthly Summary';
  if (monthlySummaryOpen) renderMonthlySummary();
});

function renderMonthlySummary() {
  if (!monthlySummaryOpen) return;

  // Group by YYYY-MM
  const groups = {};
  transactions.forEach(t => {
    const d   = new Date(t.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    groups[key] = (groups[key] || 0) + t.amount;
  });

  if (Object.keys(groups).length === 0) {
    monthlySummaryEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No data yet.</p>';
    return;
  }

  const sorted = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  const rows   = sorted.map(([month, total]) => `
    <li>
      <span>${formatMonthLabel(month)}</span>
      <strong>${formatCurrency(total)}</strong>
    </li>`).join('');

  monthlySummaryEl.innerHTML = `<h3>Monthly Totals</h3><ul>${rows}</ul>`;
}

function formatMonthLabel(yyyymm) {
  const [y, m] = yyyymm.split('-');
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// ──────────────────────── Spending Limit ───────────────────

setLimitBtn.addEventListener('click', () => {
  const val = parseFloat(spendingLimitEl.value);
  spendingLimit = isNaN(val) || val < 0 ? 0 : val;
  save();
  renderBalance();
  renderTransactions();
});

// ──────────────────────── Chart ────────────────────────────

function buildChartData() {
  const totals = {};
  transactions.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(totals);
  const data   = labels.map(l => totals[l]);
  const colors = labels.map(l => getCategoryColor(l));

  return { labels, data, colors };
}

function rebuildChart() {
  const isDark = body.getAttribute('data-theme') === 'dark';
  const { labels, data, colors } = buildChartData();

  const legendColor = isDark ? '#9ca3af' : '#6b7280';

  if (chart) {
    chart.destroy();
    chart = null;
  }

  if (data.length === 0) return; // nothing to draw

  chart = new Chart(chartCanvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor:      isDark ? '#1c1f26' : '#ffffff',
        borderWidth:      2,
        hoverOffset:      8,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:      legendColor,
            font:       { size: 12, family: "'Segoe UI', system-ui, sans-serif" },
            padding:    12,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// ──────────────────────── Render all ───────────────────────

function renderAll() {
  renderBalance();
  renderTransactions();
  renderMonthlySummary();
  rebuildChart();
}

// ──────────────────────── Security helper ──────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ──────────────────────── Init ─────────────────────────────

(function init() {
  load();
  applyTheme();
  buildCategoryOptions();

  // Restore spending limit input
  if (spendingLimit > 0) spendingLimitEl.value = spendingLimit;

  // Restore sort
  sortSelect.value = sortMode;

  renderAll();
})();
