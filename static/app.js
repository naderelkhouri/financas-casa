/**
 * Finanças SaaS — Enterprise Frontend SPA Logic & SVG Chart Engine
 * Zero external dependencies • Strict Zero-Trust Auth Flow • Pure SVG Icons
 */

const state = {
  currentMonth: new Date().toISOString().slice(0, 7),
  activeTab: 'dashboard',
  categories: [],
  transactions: [],
  summary: null,
  budgets: [],
  goals: [],
  recurringBills: []
};

let authState = {
  mode: 'login',
  user: null
};

let gateMode = 'login';

const SVG_ICONS = {
  folder: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
  target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  plane: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  car: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  laptop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>',
  book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
  heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
  login: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>'
};

function renderGoalIcon(iconKey) {
  return SVG_ICONS[iconKey] || SVG_ICONS.target;
}

// ==========================================================================
// Inicialização
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initMonthSelector();
  initEventListeners();
  registerServiceWorker();

  const isAuthenticated = await checkAuthSession();
  if (isAuthenticated) {
    await loadInitialData();
  }
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW register fail:', err);
      });
    });
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('financas_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.innerHTML = theme === 'dark'
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('financas_theme', newTheme);
  updateThemeButton(newTheme);
}

function initMonthSelector() {
  const monthInput = document.getElementById('selected-month');
  if (!monthInput) return;
  monthInput.value = state.currentMonth;

  monthInput.addEventListener('change', (e) => {
    state.currentMonth = e.target.value;
    refreshCurrentView();
  });

  document.getElementById('btn-prev-month')?.addEventListener('click', () => changeMonth(-1));
  document.getElementById('btn-next-month')?.addEventListener('click', () => changeMonth(1));
}

function changeMonth(delta) {
  const [year, month] = state.currentMonth.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  state.currentMonth = d.toISOString().slice(0, 7);
  const monthInput = document.getElementById('selected-month');
  if (monthInput) monthInput.value = state.currentMonth;
  refreshCurrentView();
}

function initEventListeners() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);

  document.getElementById('btn-open-tx-modal')?.addEventListener('click', () => openTransactionModal());
  document.getElementById('btn-open-budget-modal')?.addEventListener('click', () => openModal('modal-budget'));
  document.getElementById('btn-open-goal-modal')?.addEventListener('click', () => openGoalModal());
  document.getElementById('btn-open-recurring-modal')?.addEventListener('click', () => openModal('modal-recurring'));

  document.getElementById('tx-search-input')?.addEventListener('input', debounce(() => loadTransactions(), 300));
  document.getElementById('tx-filter-type')?.addEventListener('change', () => loadTransactions());
  document.getElementById('tx-filter-category')?.addEventListener('change', () => loadTransactions());
  document.getElementById('btn-export-csv-direct')?.addEventListener('click', () => exportData('csv'));

  document.getElementById('form-transaction')?.addEventListener('submit', handleTransactionSubmit);
  document.getElementById('form-budget')?.addEventListener('submit', handleBudgetSubmit);
  document.getElementById('form-goal')?.addEventListener('submit', handleGoalSubmit);
  document.getElementById('form-recurring')?.addEventListener('submit', handleRecurringSubmit);

  document.querySelectorAll('input[name="tx-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isExpense = e.target.value === 'expense';
      document.getElementById('type-btn-expense')?.classList.toggle('active', isExpense);
      document.getElementById('type-btn-income')?.classList.toggle('active', !isExpense);
      populateCategorySelect('tx-category', e.target.value);
    });
  });

  const dropzone = document.getElementById('import-dropzone');
  const fileInput = document.getElementById('csv-file-input');

  if (dropzone && fileInput) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent-text)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--border-light)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-light)';
      if (e.dataTransfer.files.length) {
        handleCsvFileUpload(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        handleCsvFileUpload(e.target.files[0]);
      }
    });
  }

  // Fechar modais com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.style.display = 'none';
      });
    }
  });
}

// ==========================================================================
// Navegação e Roteamento SPA
// ==========================================================================

function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    const isTarget = pane.id === `pane-${tabId}`;
    pane.classList.toggle('active', isTarget);
    pane.style.display = isTarget ? 'block' : 'none';
  });

  const titles = {
    'dashboard': { title: 'Dashboard Financeiro', sub: 'Visão consolidada do fluxo de caixa e despesas' },
    'transactions': { title: 'Extrato de Transações', sub: 'Controle detalhado de entradas e saídas' },
    'budgets-goals': { title: 'Orçamentos & Metas', sub: 'Tetos de gastos e objetivos de poupança' },
    'recurring': { title: 'Contas Recorrentes', sub: 'Lembretes de vencimento e contas fixas' },
    'accounts-cards': { title: 'Contas & Cartões', sub: 'Gestão de bancos, saldos e faturas de cartões' },
    'workspace': { title: 'Workspace & Equipe', sub: 'Gestão colaborativa de até 5 usuários por workspace' },
    'saas-admin': { title: 'Painel do Administrador', sub: 'Governança do SaaS, MRR e usuários da plataforma' },
    'import-ofx': { title: 'Importação OFX', sub: 'Conciliação automática de extratos bancários brasileiros' },
    'bunkerpay-sub': { title: 'Assinatura BunkerPay', sub: 'Planos Pro com liquidação direta em PIX' },
    'reports': { title: 'Relatórios & Backup', sub: 'Importação, exportação e impressão consolidada' }
  };

  if (titles[tabId]) {
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-subtitle');
    if (titleEl) titleEl.textContent = titles[tabId].title;
    if (subEl) subEl.textContent = titles[tabId].sub;
  }

  document.getElementById('sidebar')?.classList.remove('open');
  refreshCurrentView();
}

function refreshCurrentView() {
  if (!authState.user) return;

  loadCategories().then(() => {
    if (state.activeTab === 'dashboard') {
      loadDashboard();
    } else if (state.activeTab === 'transactions') {
      loadTransactions();
    } else if (state.activeTab === 'budgets-goals') {
      loadBudgetsAndGoals();
    } else if (state.activeTab === 'recurring') {
      loadRecurringBills();
    } else if (state.activeTab === 'accounts-cards') {
      loadAccountsAndCards();
    } else if (state.activeTab === 'workspace') {
      loadWorkspace();
    } else if (state.activeTab === 'saas-admin') {
      loadAdminDashboard();
    }
  });
}

async function loadInitialData() {
  await loadCategories();
  await loadDashboard();
  await updateRecurringBadge();
  await loadWorkspace();
}

// ==========================================================================
// Carregamento de Dados da API
// ==========================================================================

async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) return;
    state.categories = await res.json();
    populateCategorySelect('tx-category', 'expense');
    populateCategorySelect('tx-filter-category', '');
    populateCategorySelect('budget-category', 'expense');
    populateCategorySelect('rec-category', 'expense');
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

function populateCategorySelect(selectId, filterType) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '';

  if (selectId === 'tx-filter-category') {
    select.innerHTML = '<option value="">Todas as Categorias</option>';
  }

  state.categories
    .filter(c => !filterType || c.type === filterType)
    .forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });

  if (currentVal) select.value = currentVal;
}

async function loadDashboard() {
  try {
    const res = await fetch(`/api/dashboard?month=${state.currentMonth}`);
    if (res.status === 401) return;
    const data = await res.json();
    state.summary = data;

    // Suporte híbrido ao contrato JSON (totals aninhado ou raiz)
    const totals = data.totals || {
      total_income: data.total_income || 0,
      total_expense: data.total_expense || 0,
      balance: data.net_balance ?? ((data.total_income || 0) - (data.total_expense || 0)),
      pending_income: data.pending_income || 0,
      pending_expense: data.pending_expense || 0,
      savings_rate: Math.round((data.savings_rate || 0) * 10) / 10
    };

    const expensesByCategory = data.expenses_by_category || (data.category_distribution || []).map(c => ({
      name: c.name,
      color: c.color,
      icon: c.icon,
      total_amount: Number(c.total_amount ?? c.total) || 0
    }));

    const budgetsStatus = data.budgets_status || [];
    const monthlyHistory = data.monthly_history || [];

    document.getElementById('dash-income').textContent = formatCurrency(totals.total_income);
    document.getElementById('dash-expense').textContent = formatCurrency(totals.total_expense);
    document.getElementById('dash-balance').textContent = formatCurrency(totals.balance);

    document.getElementById('dash-pending-income').textContent = `Pendente: ${formatCurrency(totals.pending_income)}`;
    document.getElementById('dash-pending-expense').textContent = `Pendente: ${formatCurrency(totals.pending_expense)}`;
    document.getElementById('dash-savings-rate').textContent = `Taxa de Poupança: ${totals.savings_rate}%`;

    const exceeded = budgetsStatus.filter(b => b.spent_amount > b.monthly_limit).length;
    const alertEl = document.getElementById('dash-budget-status');
    const alertDetEl = document.getElementById('dash-budget-details');
    if (exceeded > 0) {
      alertEl.textContent = `${exceeded} Excedido(s)`;
      alertEl.style.color = 'var(--accent-danger)';
      alertDetEl.textContent = 'Atenção aos tetos de gastos';
    } else {
      alertEl.textContent = 'Em dia';
      alertEl.style.color = 'var(--text-primary)';
      alertDetEl.textContent = 'Orçamentos controlados';
    }

    renderCategoryDonut(expensesByCategory);
    renderMonthlyHistoryBarChart(monthlyHistory);
    renderDashboardBudgetsMini(budgetsStatus);
    loadDashboardRecentTx();
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

async function loadTransactions() {
  const type = document.getElementById('tx-filter-type')?.value || '';
  const catId = document.getElementById('tx-filter-category')?.value || '';
  const search = document.getElementById('tx-search-input')?.value || '';

  let url = `/api/transactions?month=${state.currentMonth}`;
  if (type) url += `&type=${type}`;
  if (catId) url += `&category_id=${catId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const transactions = await res.json();
    state.transactions = transactions;

    const tbody = document.getElementById('transactions-tbody');
    const emptyState = document.getElementById('tx-empty-state');
    const table = document.getElementById('transactions-table');

    tbody.innerHTML = '';

    if (!transactions.length) {
      emptyState.style.display = 'block';
      table.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    table.style.display = 'table';

    transactions.forEach(t => {
      const tr = document.createElement('tr');
      const isIncome = t.type === 'income';
      const amountColor = isIncome ? 'var(--accent-success)' : 'var(--accent-danger)';
      const amountPrefix = isIncome ? '+ ' : '- ';

      tr.innerHTML = `
        <td><strong>${formatDate(t.date)}</strong></td>
        <td>
          <div style="font-weight:600;">${escapeHtml(t.description)}</div>
          ${t.notes ? `<small class="text-muted">${escapeHtml(t.notes)}</small>` : ''}
          ${t.tags ? `<span class="badge" style="background:var(--bg-secondary); margin-left:4px;">#${escapeHtml(t.tags)}</span>` : ''}
        </td>
        <td>
          <span style="display:inline-flex; align-items:center; gap:8px;">
            <span class="legend-color-dot" style="background:${t.category_color || 'var(--accent-text)'};"></span>
            <span>${escapeHtml(t.category_name || 'Geral')}</span>
          </span>
        </td>
        <td><span class="text-muted">${escapeHtml(t.payment_method || '-')}</span></td>
        <td>
          <span class="badge ${t.status === 'paid' ? 'badge-paid' : 'badge-pending'}">
            ${t.status === 'paid' ? 'Concluído' : 'Pendente'}
          </span>
        </td>
        <td class="text-right tabular-nums" style="font-weight:700; color:${amountColor};">
          ${amountPrefix}${formatCurrency(t.amount)}
        </td>
        <td class="text-center">
          <button type="button" class="btn-action-icon" onclick="editTransaction(${t.id})" title="Editar">${SVG_ICONS.edit}</button>
          <button type="button" class="btn-action-icon delete" onclick="deleteTransaction(${t.id})" title="Excluir">${SVG_ICONS.trash}</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao carregar transações:', err);
  }
}

async function loadDashboardRecentTx() {
  try {
    const res = await fetch(`/api/transactions?month=${state.currentMonth}`);
    if (!res.ok) return;
    const transactions = await res.json();
    const container = document.getElementById('dash-recent-tx');
    container.innerHTML = '';

    const recent = transactions.slice(0, 5);
    if (!recent.length) {
      container.innerHTML = '<p class="text-muted" style="font-size:0.85rem;">Nenhuma transação recente neste mês.</p>';
      return;
    }

    recent.forEach(t => {
      const isIncome = t.type === 'income';
      const color = isIncome ? 'var(--accent-success)' : 'var(--accent-danger)';
      const prefix = isIncome ? '+' : '-';
      const row = document.createElement('div');
      row.className = 'mini-tx-row';
      row.innerHTML = `
        <div class="mini-tx-info">
          <span class="mini-tx-icon">${SVG_ICONS.folder}</span>
          <div>
            <div style="font-weight:600;">${escapeHtml(t.description)}</div>
            <small class="text-muted">${formatDate(t.date)} • ${escapeHtml(t.category_name || 'Geral')}</small>
          </div>
        </div>
        <div class="tabular-nums" style="font-weight:700; color:${color};">
          ${prefix} ${formatCurrency(t.amount)}
        </div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadBudgetsAndGoals() {
  try {
    const [bRes, gRes, sRes] = await Promise.all([
      fetch('/api/budgets'),
      fetch('/api/goals'),
      fetch(`/api/dashboard?month=${state.currentMonth}`)
    ]);
    const budgets = bRes.ok ? await bRes.json() : [];
    const goals = gRes.ok ? await gRes.json() : [];
    const summary = sRes.ok ? await sRes.json() : {};

    state.budgets = budgets;
    state.goals = goals;
    const budgetsStatus = summary.budgets_status || [];

    const bList = document.getElementById('budgets-full-list');
    bList.innerHTML = '';

    if (!budgetsStatus.length) {
      bList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${SVG_ICONS.target}</div>
          <h3>Nenhum teto configurado</h3>
          <p>Defina tetos mensais para controlar os gastos por categoria.</p>
          <button type="button" class="btn-primary" onclick="openModal('modal-budget')">Criar Primeiro Teto</button>
        </div>
      `;
    } else {
      budgetsStatus.forEach(b => {
        const pct = Math.min(b.percentage, 100);
        let barClass = 'progress-fill-success';
        if (b.percentage > 90) barClass = 'progress-fill-danger';
        else if (b.percentage > 75) barClass = 'progress-fill-warning';

        const item = document.createElement('div');
        item.className = 'budget-item';
        item.innerHTML = `
          <div class="budget-item-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="legend-color-dot" style="background:${b.category_color || 'var(--accent-text)'};"></span>
              <span>${escapeHtml(b.category_name)}</span>
            </div>
            <div class="tabular-nums">
              <span style="font-weight:700;">${formatCurrency(b.spent_amount)}</span> /
              <span class="text-muted">${formatCurrency(b.monthly_limit)}</span>
              <span style="font-size:0.8rem; margin-left:6px; color:${b.percentage > 100 ? 'var(--accent-danger)' : 'var(--text-secondary)'}">(${b.percentage}%)</span>
              <button type="button" class="btn-action-icon delete" onclick="deleteBudget(${b.budget_id})" title="Remover Teto" style="margin-left:8px;">${SVG_ICONS.trash}</button>
            </div>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${barClass}" style="width: ${pct}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted);">
            <span>${b.remaining >= 0 ? `Restante: ${formatCurrency(b.remaining)}` : `<strong style="color:var(--accent-danger)">Excedido em ${formatCurrency(Math.abs(b.remaining))}</strong>`}</span>
          </div>
        `;
        bList.appendChild(item);
      });
    }

    const gList = document.getElementById('goals-list');
    gList.innerHTML = '';

    if (!goals.length) {
      gList.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">${SVG_ICONS.shield}</div>
          <h3>Nenhuma meta cadastrada</h3>
          <p>Crie metas de economia para acompanhar a evolução do seu patrimônio.</p>
          <button type="button" class="btn-primary" onclick="openGoalModal()">Criar Meta</button>
        </div>
      `;
    } else {
      goals.forEach(g => {
        const pct = Math.min(g.percentage || 0, 100);
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
          <div class="goal-card-header">
            <div class="goal-title-wrapper">
              <span class="goal-icon">${renderGoalIcon(g.icon)}</span>
              <div>
                <div class="goal-title">${escapeHtml(g.title)}</div>
                ${g.deadline ? `<small class="text-muted">Prazo: ${formatDate(g.deadline)}</small>` : ''}
              </div>
            </div>
            <div>
              <button type="button" class="btn-action-icon" onclick="editGoal(${g.id})" title="Editar">${SVG_ICONS.edit}</button>
              <button type="button" class="btn-action-icon delete" onclick="deleteGoal(${g.id})" title="Excluir">${SVG_ICONS.trash}</button>
            </div>
          </div>

          <div class="tabular-nums" style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:700; margin-top:4px;">
            <span style="color:var(--accent-text);">${formatCurrency(g.current_amount)}</span>
            <span class="text-muted">${formatCurrency(g.target_amount)}</span>
          </div>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill progress-fill-success" style="width: ${pct}%;"></div>
          </div>

          <div class="tabular-nums" style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted);">
            <span>Progresso: <strong>${g.percentage || 0}%</strong></span>
            <span>Faltam: ${formatCurrency(Math.max(0, g.target_amount - g.current_amount))}</span>
          </div>
        `;
        gList.appendChild(card);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function renderDashboardBudgetsMini(budgets) {
  const container = document.getElementById('dash-budgets-list');
  container.innerHTML = '';

  if (!budgets || !budgets.length) {
    container.innerHTML = '<p class="text-muted" style="font-size:0.85rem;">Nenhum teto configurado.</p>';
    return;
  }

  budgets.slice(0, 4).forEach(b => {
    const pct = Math.min(b.percentage, 100);
    let barClass = 'progress-fill-success';
    if (b.percentage > 90) barClass = 'progress-fill-danger';
    else if (b.percentage > 75) barClass = 'progress-fill-warning';

    const div = document.createElement('div');
    div.className = 'budget-item';
    div.innerHTML = `
      <div class="budget-item-header">
        <span>${escapeHtml(b.category_name)}</span>
        <span class="tabular-nums">${formatCurrency(b.spent_amount)} / ${formatCurrency(b.monthly_limit)}</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill ${barClass}" style="width: ${pct}%;"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

async function loadRecurringBills() {
  try {
    const res = await fetch(`/api/recurring?month=${state.currentMonth}`);
    if (!res.ok) return;
    const bills = await res.json();
    state.recurringBills = bills;

    const tbody = document.getElementById('recurring-tbody');
    tbody.innerHTML = '';

    if (!bills.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">Nenhuma conta fixa cadastrada.</td></tr>`;
      return;
    }

    bills.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>Todo dia ${String(b.due_day).padStart(2, '0')}</strong></td>
        <td>
          <div style="font-weight:600;">${escapeHtml(b.description)}</div>
          ${b.notes ? `<small class="text-muted">${escapeHtml(b.notes)}</small>` : ''}
        </td>
        <td>
          <span>${escapeHtml(b.category_name || 'Geral')}</span>
        </td>
        <td class="tabular-nums" style="font-weight:700;">${formatCurrency(b.amount)}</td>
        <td><span class="text-muted">${escapeHtml(b.payment_method || 'PIX')}</span></td>
        <td>
          <span class="badge badge-${b.status_class}">
            ${b.status_label}
          </span>
        </td>
        <td class="text-center">
          ${b.is_paid
            ? `<button type="button" class="btn-secondary" onclick="unpayRecurringBill(${b.id})" style="font-size:0.78rem; padding:4px 10px;">Desmarcar</button>`
            : `<button type="button" class="btn-primary" onclick="payRecurringBill(${b.id})" style="font-size:0.78rem; padding:4px 10px;">Pagar no Mês</button>`
          }
          <button type="button" class="btn-action-icon delete" onclick="deleteRecurringBill(${b.id})" title="Excluir" style="margin-left:6px;">${SVG_ICONS.trash}</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    updateRecurringBadge();
  } catch (err) {
    console.error(err);
  }
}

async function updateRecurringBadge() {
  try {
    const res = await fetch(`/api/recurring?month=${state.currentMonth}`);
    if (!res.ok) return;
    const bills = await res.json();
    const pendingCount = bills.filter(b => !b.is_paid).length;
    const badge = document.getElementById('recurring-badge');
    if (!badge) return;
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    console.error(e);
  }
}

// ==========================================================================
// Handlers de Formulários & Ações
// ==========================================================================

async function handleTransactionSubmit(e) {
  e.preventDefault();
  const txId = document.getElementById('tx-id').value;
  const payload = {
    type: document.querySelector('input[name="tx-type"]:checked').value,
    description: document.getElementById('tx-desc').value,
    amount: parseFloat(document.getElementById('tx-amount').value),
    date: document.getElementById('tx-date').value,
    category_id: parseInt(document.getElementById('tx-category').value) || null,
    payment_method: document.getElementById('tx-payment-method').value,
    status: document.getElementById('tx-status').value,
    tags: document.getElementById('tx-tags').value,
    notes: document.getElementById('tx-notes').value
  };

  try {
    const res = txId
      ? await fetch(`/api/transactions/${txId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      : await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

    if (res.ok) {
      closeModal('modal-transaction');
      showToast('Transação salva com sucesso!', 'success');
      refreshCurrentView();
    } else {
      showToast('Erro ao salvar transação', 'error');
    }
  } catch (err) {
    showToast('Falha na comunicação com o servidor', 'error');
  }
}

async function editTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;

  document.getElementById('tx-id').value = tx.id;
  document.getElementById('modal-tx-title').textContent = 'Editar Transação';
  document.getElementById('tx-desc').value = tx.description;
  document.getElementById('tx-amount').value = tx.amount;
  document.getElementById('tx-date').value = tx.date;
  document.getElementById('tx-payment-method').value = tx.payment_method || 'PIX';
  document.getElementById('tx-status').value = tx.status || 'paid';
  document.getElementById('tx-tags').value = tx.tags || '';
  document.getElementById('tx-notes').value = tx.notes || '';

  const isExpense = tx.type === 'expense';
  document.querySelector(`input[name="tx-type"][value="${tx.type}"]`).checked = true;
  document.getElementById('type-btn-expense').classList.toggle('active', isExpense);
  document.getElementById('type-btn-income').classList.toggle('active', !isExpense);

  populateCategorySelect('tx-category', tx.type);
  if (tx.category_id) {
    document.getElementById('tx-category').value = tx.category_id;
  }

  openModal('modal-transaction');
}

async function deleteTransaction(id) {
  if (!confirm('Deseja realmente excluir esta transação?')) return;
  try {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Transação excluída.', 'success');
      refreshCurrentView();
    }
  } catch (e) {
    showToast('Erro ao excluir transação', 'error');
  }
}

function openTransactionModal() {
  document.getElementById('form-transaction').reset();
  document.getElementById('tx-id').value = '';
  document.getElementById('modal-tx-title').textContent = 'Nova Transação';
  document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('type-btn-expense').classList.add('active');
  document.getElementById('type-btn-income').classList.remove('active');
  document.querySelector('input[name="tx-type"][value="expense"]').checked = true;
  populateCategorySelect('tx-category', 'expense');
  openModal('modal-transaction');
}

async function handleBudgetSubmit(e) {
  e.preventDefault();
  const payload = {
    category_id: document.getElementById('budget-category').value,
    monthly_limit: parseFloat(document.getElementById('budget-limit').value)
  };

  try {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('modal-budget');
      showToast('Orçamento salvo com sucesso!', 'success');
      refreshCurrentView();
    }
  } catch (err) {
    showToast('Erro ao salvar orçamento', 'error');
  }
}

async function deleteBudget(id) {
  if (!confirm('Deseja remover este teto de orçamento?')) return;
  try {
    const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Orçamento removido.', 'success');
      refreshCurrentView();
    }
  } catch (err) {
    showToast('Erro ao remover orçamento', 'error');
  }
}

function openGoalModal() {
  document.getElementById('form-goal').reset();
  document.getElementById('goal-id').value = '';
  document.getElementById('modal-goal-title').textContent = 'Nova Meta de Economia';
  openModal('modal-goal');
}

async function handleGoalSubmit(e) {
  e.preventDefault();
  const goalId = document.getElementById('goal-id').value;
  const payload = {
    title: document.getElementById('goal-title').value,
    target_amount: parseFloat(document.getElementById('goal-target').value),
    current_amount: parseFloat(document.getElementById('goal-current').value),
    deadline: document.getElementById('goal-deadline').value,
    icon: document.getElementById('goal-icon').value,
    notes: document.getElementById('goal-notes').value
  };

  try {
    const res = goalId
      ? await fetch(`/api/goals/${goalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      : await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

    if (res.ok) {
      closeModal('modal-goal');
      showToast('Meta salva com sucesso!', 'success');
      refreshCurrentView();
    }
  } catch (err) {
    showToast('Erro ao salvar meta', 'error');
  }
}

async function editGoal(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) return;

  document.getElementById('goal-id').value = g.id;
  document.getElementById('modal-goal-title').textContent = 'Editar Meta';
  document.getElementById('goal-title').value = g.title;
  document.getElementById('goal-target').value = g.target_amount;
  document.getElementById('goal-current').value = g.current_amount;
  document.getElementById('goal-deadline').value = g.deadline || '';
  document.getElementById('goal-icon').value = SVG_ICONS[g.icon] ? g.icon : 'target';
  document.getElementById('goal-notes').value = g.notes || '';

  openModal('modal-goal');
}

async function deleteGoal(id) {
  if (!confirm('Deseja excluir esta meta?')) return;
  try {
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Meta excluída.', 'success');
      refreshCurrentView();
    }
  } catch (e) {
    showToast('Erro ao excluir meta', 'error');
  }
}

async function handleRecurringSubmit(e) {
  e.preventDefault();
  const payload = {
    description: document.getElementById('rec-desc').value,
    amount: parseFloat(document.getElementById('rec-amount').value),
    due_day: parseInt(document.getElementById('rec-day').value),
    category_id: parseInt(document.getElementById('rec-category').value) || null,
    payment_method: document.getElementById('rec-payment').value,
    notes: document.getElementById('rec-notes').value
  };

  try {
    const res = await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('modal-recurring');
      showToast('Conta fixa cadastrada!', 'success');
      refreshCurrentView();
    }
  } catch (e) {
    showToast('Erro ao cadastrar conta fixa', 'error');
  }
}

async function payRecurringBill(id) {
  try {
    const res = await fetch(`/api/recurring/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: state.currentMonth, create_transaction: true })
    });
    if (res.ok) {
      showToast('Conta marcada como paga no mês!', 'success');
      refreshCurrentView();
    }
  } catch (e) {
    showToast('Erro ao registrar pagamento', 'error');
  }
}

async function unpayRecurringBill(id) {
  try {
    const res = await fetch(`/api/recurring/${id}/unpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: state.currentMonth })
    });
    if (res.ok) {
      showToast('Pagamento desmarcado.', 'success');
      refreshCurrentView();
    }
  } catch (e) {
    showToast('Erro ao desmarcar pagamento', 'error');
  }
}

async function deleteRecurringBill(id) {
  if (!confirm('Deseja excluir esta conta fixa recorrente?')) return;
  try {
    const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Conta fixa removida.', 'success');
      refreshCurrentView();
    }
  } catch (e) {
    showToast('Erro ao excluir conta fixa', 'error');
  }
}

function exportData(type) {
  if (type === 'csv') {
    window.location.href = `/api/export/csv?month=${state.currentMonth}`;
  } else if (type === 'json') {
    window.location.href = `/api/export/json`;
  }
}

function handleCsvFileUpload(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = e.target.result;
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Importação concluída: ${data.count} transações inseridas!`, 'success');
        refreshCurrentView();
      } else {
        showToast(data.error || 'Erro na importação', 'error');
      }
    } catch (err) {
      showToast('Falha ao enviar arquivo', 'error');
    }
  };
  reader.readAsText(file);
}

async function resetDemoData() {
  if (!confirm('Atenção: Isso irá restaurar a base para os dados de demonstração iniciais. Continuar?')) return;
  try {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    if (res.ok) {
      showToast('Dados de demonstração restaurados com sucesso!', 'success');
      refreshCurrentView();
    }
  } catch (e) {
    showToast('Erro ao restaurar dados', 'error');
  }
}

// ==========================================================================
// SVG Chart Rendering Engine
// ==========================================================================

function renderCategoryDonut(categories) {
  const container = document.getElementById('category-donut-container');
  const legend = document.getElementById('category-legend');
  if (!container || !legend) return;
  container.innerHTML = '';
  legend.innerHTML = '';

  const list = categories || [];
  const total = list.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0);

  if (total === 0 || !list.length) {
    container.innerHTML = `
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="70" fill="none" stroke="var(--border-color)" stroke-width="20" />
        <text x="90" y="95" text-anchor="middle" fill="var(--text-muted)" font-size="12" font-weight="600">Sem Despesas</text>
      </svg>
    `;
    legend.innerHTML = '<p class="text-muted" style="font-size:0.85rem;">Nenhuma despesa registrada para este mês.</p>';
    return;
  }

  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  let svgPaths = '';

  list.forEach(c => {
    const amount = Number(c.total_amount) || 0;
    const percentage = amount / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;

    svgPaths += `
      <circle cx="${cx}" cy="${cy}" r="${radius}"
        fill="none"
        stroke="${c.color || '#3b82f6'}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${strokeDasharray}"
        stroke-dashoffset="${strokeDashoffset}"
        style="transition: stroke-dasharray 0.5s ease;"
      />
    `;

    currentOffset += percentage * circumference;

    const pctLabel = (percentage * 100).toFixed(1);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-name">
        <span class="legend-color-dot" style="background-color:${c.color || '#3b82f6'};"></span>
        <span>${escapeHtml(c.name)}</span>
      </div>
      <div class="legend-value tabular-nums">${formatCurrency(amount)} <span class="text-muted" style="font-size:0.78rem; font-weight:normal;">(${pctLabel}%)</span></div>
    `;
    legend.appendChild(item);
  });

  container.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
      ${svgPaths}
    </svg>
  `;
}

function renderMonthlyHistoryBarChart(history) {
  const container = document.getElementById('history-barchart-container');
  if (!container) return;
  container.innerHTML = '';

  if (!history || !history.length) {
    container.innerHTML = '<p class="text-muted" style="text-align:center; padding-top:80px;">Sem histórico suficiente.</p>';
    return;
  }

  const width = container.clientWidth || 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const maxVal = Math.max(...history.flatMap(h => [Number(h.income) || 0, Number(h.expense) || 0]), 1000);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barGroupWidth = chartWidth / history.length;
  const barWidth = Math.max(12, Math.min(24, (barGroupWidth - 20) / 2));

  let barsSvg = '';
  let labelsSvg = '';

  history.forEach((h, idx) => {
    const groupX = padding.left + idx * barGroupWidth;

    const incomeHeight = ((Number(h.income) || 0) / maxVal) * chartHeight;
    const incomeY = padding.top + (chartHeight - incomeHeight);
    const incomeX = groupX + (barGroupWidth / 2) - barWidth - 2;

    const expenseHeight = ((Number(h.expense) || 0) / maxVal) * chartHeight;
    const expenseY = padding.top + (chartHeight - expenseHeight);
    const expenseX = groupX + (barGroupWidth / 2) + 2;

    const monthLabel = String(h.month_period || '').slice(5);

    barsSvg += `
      <rect x="${incomeX}" y="${incomeY}" width="${barWidth}" height="${Math.max(2, incomeHeight)}" rx="4" fill="var(--accent-success)" opacity="0.9">
        <title>Receitas (${h.month_period}): ${formatCurrency(h.income)}</title>
      </rect>
      <rect x="${expenseX}" y="${expenseY}" width="${barWidth}" height="${Math.max(2, expenseHeight)}" rx="4" fill="var(--accent-danger)" opacity="0.9">
        <title>Despesas (${h.month_period}): ${formatCurrency(h.expense)}</title>
      </rect>
    `;

    labelsSvg += `
      <text x="${groupX + barGroupWidth / 2}" y="${height - 12}" text-anchor="middle" fill="var(--text-muted)" font-size="12" font-weight="600">
        ${monthLabel}
      </text>
    `;
  });

  container.innerHTML = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
      <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="var(--border-color)" stroke-dasharray="3" />
      <line x1="${padding.left}" y1="${padding.top + chartHeight / 2}" x2="${width - padding.right}" y2="${padding.top + chartHeight / 2}" stroke="var(--border-color)" stroke-dasharray="3" />
      <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="var(--border-color)" />
      ${barsSvg}
      ${labelsSvg}
    </svg>
  `;
}

// ==========================================================================
// Utilitários & Helpers
// ==========================================================================

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? SVG_ICONS.check : SVG_ICONS.alert}</span> <span style="color:var(--text-primary);">${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ==========================================================================
// MÓDULOS SAAS: CONTAS, CARTÕES, OFX E BUNKERPAY
// ==========================================================================

async function loadAccountsAndCards() {
  try {
    const [accRes, cardRes] = await Promise.all([
      fetch('/api/accounts'),
      fetch('/api/credit-cards')
    ]);
    const accounts = accRes.ok ? await accRes.json() : [];
    const cards = cardRes.ok ? await cardRes.json() : [];

    const accContainer = document.getElementById('accounts-list');
    if (accContainer) {
      if (accounts.length === 0) {
        accContainer.innerHTML = '<p class="text-muted">Nenhuma conta cadastrada.</p>';
      } else {
        accContainer.innerHTML = accounts.map(a => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color); margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="legend-color-dot" style="background: ${a.color || 'var(--accent-success)'};"></span>
              <div>
                <strong>${escapeHtml(a.name)}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(a.account_type)}</div>
              </div>
            </div>
            <strong class="tabular-nums" style="color: var(--text-primary);">${formatCurrency(a.current_balance)}</strong>
          </div>
        `).join('');
      }
    }

    const cardsContainer = document.getElementById('cards-list');
    if (cardsContainer) {
      if (cards.length === 0) {
        cardsContainer.innerHTML = '<p class="text-muted">Nenhum cartão cadastrado.</p>';
      } else {
        cardsContainer.innerHTML = cards.map(c => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color); margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="legend-color-dot" style="background: ${c.color || 'var(--accent-text)'};"></span>
              <div>
                <strong>${escapeHtml(c.name)}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Fecha dia ${c.closing_day} | Vence dia ${c.due_day}</div>
              </div>
            </div>
            <span class="tabular-nums" style="font-size: 0.9rem;">Limite: <strong>${formatCurrency(c.credit_limit)}</strong></span>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Erro ao carregar contas/cartões:', err);
  }
}

document.getElementById('form-account')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('acc-name').value;
  const account_type = document.getElementById('acc-type').value;
  const initial_balance = parseFloat(document.getElementById('acc-balance').value) || 0;

  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, account_type, initial_balance })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Conta criada com sucesso!');
      closeModal('modal-account');
      loadAccountsAndCards();
    } else {
      showToast(data.error || 'Erro ao criar conta', 'error');
    }
  } catch (err) {
    showToast('Erro de rede ao criar conta', 'error');
  }
});

document.getElementById('form-card')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('card-name').value;
  const credit_limit = parseFloat(document.getElementById('card-limit').value) || 0;
  const closing_day = parseInt(document.getElementById('card-closing').value) || 25;
  const due_day = parseInt(document.getElementById('card-due').value) || 5;

  try {
    const res = await fetch('/api/credit-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, credit_limit, closing_day, due_day })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Cartão cadastrado com sucesso!');
      closeModal('modal-card');
      loadAccountsAndCards();
    } else {
      showToast(data.error || 'Erro ao cadastrar cartão', 'error');
    }
  } catch (err) {
    showToast('Erro de rede ao cadastrar cartão', 'error');
  }
});

async function handleOfxFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target.result;
    const resultDiv = document.getElementById('ofx-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p class="text-muted">Processando extrato bancário...</p>';

    try {
      const res = await fetch('/api/import/ofx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        resultDiv.innerHTML = `
          <div style="background: var(--accent-success-bg); border: 1px solid var(--accent-success); padding: 16px; border-radius: 8px; color: var(--accent-success);">
            <h3 style="font-size: 1rem;">Extrato Importado com Sucesso</h3>
            <p style="margin-top: 8px; color: var(--text-primary);">Foram importadas <strong>${data.imported_count}</strong> transações (${escapeHtml(data.bank_id || 'Bancário')}).</p>
          </div>
        `;
        showToast(`${data.imported_count} lançamentos adicionados via OFX!`);
        loadTransactions();
      } else {
        resultDiv.innerHTML = `<p style="color: var(--accent-danger);">Erro: ${escapeHtml(data.error)}</p>`;
      }
    } catch (err) {
      resultDiv.innerHTML = `<p style="color: var(--accent-danger);">Erro ao enviar arquivo para o servidor.</p>`;
    }
  };
  reader.readAsText(file);
}

async function startBunkerpayCheckout(planKey) {
  try {
    const res = await fetch('/api/bunkerpay/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planKey })
    });
    const charge = await res.json();
    const contentDiv = document.getElementById('bunkerpay-pix-content');

    contentDiv.innerHTML = `
      <div class="tabular-nums" style="font-size: 1.15rem; margin-bottom: 12px;">Valor: <strong>R$ ${Number(charge.amount || 0).toFixed(2)}</strong></div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Copie a chave Pix abaixo para liquidação direta via BunkerPay:</p>
      <textarea readonly style="width: 100%; height: 90px; padding: 10px; font-family: var(--font-mono); font-size: 0.78rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: none;">${escapeHtml(charge.pix_copy_paste)}</textarea>
      <button type="button" class="btn-primary mt-3" style="width: 100%; justify-content: center;" onclick="navigator.clipboard.writeText('${escapeHtml(charge.pix_copy_paste)}'); showToast('Código Pix copiado!');">
        Copiar Código Pix
      </button>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 12px;">Liquidação instantânea &amp; privacidade patrimonial garantida.</div>
    `;

    openModal('bunkerpay-pix-modal');
  } catch (err) {
    showToast('Erro ao gerar cobrança BunkerPay', 'error');
  }
}

// ==========================================================================
// MÓDULO DE AUTENTICAÇÃO SEGURA (ZERO-TRUST GATE)
// ==========================================================================

async function checkAuthSession() {
  const gate = document.getElementById('auth-screen-gate');
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        authState.user = data.user;
        updateUserUI(data.user);
        if (gate) gate.style.display = 'none';
        return true;
      }
    }
    updateUserUI(null);
    if (gate) gate.style.display = 'flex';
    return false;
  } catch (err) {
    updateUserUI(null);
    if (gate) gate.style.display = 'flex';
    return false;
  }
}

function updateUserUI(user) {
  const nameEl = document.getElementById('user-display-name');
  const planEl = document.getElementById('user-display-plan');
  const avatarEl = document.getElementById('user-avatar');
  const btnAuth = document.getElementById('btn-auth-action');
  const adminNav = document.getElementById('nav-saas-admin');

  if (user) {
    if (nameEl) nameEl.textContent = user.name || user.email.split('@')[0];
    if (planEl) planEl.textContent = (user.role === 'admin' ? 'Admin • ' : '') + (user.plan || 'Free');
    if (avatarEl) avatarEl.textContent = (user.name || user.email)[0].toUpperCase();
    if (btnAuth) {
      btnAuth.innerHTML = SVG_ICONS.logout;
      btnAuth.title = 'Sair da Conta (Logout)';
    }
    if (adminNav) {
      adminNav.style.display = user.role === 'admin' ? 'flex' : 'none';
    }
  } else {
    if (nameEl) nameEl.textContent = 'Visitante';
    if (planEl) planEl.textContent = 'Não Autenticado';
    if (avatarEl) avatarEl.textContent = '?';
    if (btnAuth) {
      btnAuth.innerHTML = SVG_ICONS.login;
      btnAuth.title = 'Entrar na Conta';
    }
    if (adminNav) adminNav.style.display = 'none';
  }
}

function handleAuthClick() {
  if (authState.user) {
    if (confirm('Deseja realmente encerrar a sessão?')) {
      logoutUser();
    }
  } else {
    const gate = document.getElementById('auth-screen-gate');
    if (gate) gate.style.display = 'flex';
  }
}

function switchGateAuthMode(mode) {
  gateMode = mode;
  const isRegister = mode === 'register';
  document.getElementById('gate-tab-login')?.classList.toggle('active', !isRegister);
  document.getElementById('gate-tab-register')?.classList.toggle('active', isRegister);

  const nameGroup = document.getElementById('gate-group-name');
  const submitBtn = document.getElementById('gate-submit-btn');

  if (nameGroup) nameGroup.style.display = isRegister ? 'block' : 'none';
  if (submitBtn) submitBtn.textContent = isRegister ? 'Criar Minha Conta' : 'Entrar na Plataforma';
}

async function handleGateAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('gate-email').value.trim();
  const password = document.getElementById('gate-password').value;
  const name = document.getElementById('gate-name')?.value.trim();

  const endpoint = gateMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  const body = gateMode === 'register' ? { name, email, password } : { email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(gateMode === 'register' ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
      authState.user = data.user;
      updateUserUI(data.user);
      const gate = document.getElementById('auth-screen-gate');
      if (gate) gate.style.display = 'none';
      await loadInitialData();
      refreshCurrentView();
    } else {
      showToast(data.error || 'Erro na autenticação.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão ao autenticar.', 'error');
  }
}

async function logoutUser() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    authState.user = null;
    updateUserUI(null);
    showToast('Sessão encerrada com segurança.');
    const gate = document.getElementById('auth-screen-gate');
    if (gate) gate.style.display = 'flex';
  } catch (err) {
    showToast('Erro ao sair da conta.', 'error');
  }
}

// ==========================================================================
// PAINEL ADMINISTRATIVO DO SAAS (SUPER ADMIN)
// ==========================================================================

async function loadAdminDashboard() {
  try {
    const res = await fetch('/api/admin/overview');
    if (!res.ok) {
      showToast('Acesso restrito a administradores.', 'error');
      return;
    }

    const data = await res.json();
    const m = data.metrics || {};

    document.getElementById('admin-total-users').textContent = m.total_users || 0;
    document.getElementById('admin-free-users').textContent = `${m.free_users || 0} no plano gratuito`;
    document.getElementById('admin-pro-users').textContent = m.pro_subscribers || 0;
    document.getElementById('admin-mrr').textContent = formatCurrency(m.estimated_mrr || 0);
    document.getElementById('admin-tx-count').textContent = m.total_transactions || 0;
    document.getElementById('admin-volume').textContent = `${formatCurrency(m.total_financial_volume || 0)} movimentados`;

    const tbody = document.getElementById('admin-users-table-body');
    if (tbody) {
      if (!data.users || data.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 24px; text-align: center; color: var(--text-muted);">Nenhum usuário cadastrado.</td></tr>';
      } else {
        tbody.innerHTML = data.users.map(u => `
          <tr>
            <td style="font-weight: 600;">#${u.id}</td>
            <td>
              <strong>${escapeHtml(u.name)}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(u.email)}</div>
            </td>
            <td>
              <span class="badge ${u.plan.startsWith('pro') ? 'badge-paid' : ''}" style="${!u.plan.startsWith('pro') ? 'background:var(--bg-secondary); color:var(--text-secondary);' : ''}">
                ${escapeHtml(u.plan.toUpperCase())}
              </span>
            </td>
            <td>
              <span style="font-weight: 600; color: ${u.role === 'admin' ? 'var(--accent-warning)' : 'inherit'};">
                ${u.role === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
            </td>
            <td>
              <span>${u.tx_count || 0} lançamentos</span>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${u.accounts_count || 0} contas</div>
            </td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">
              ${formatDate(String(u.created_at || '').slice(0, 10))}
            </td>
            <td class="text-right">
              <button type="button" class="btn-ghost" style="padding: 4px 10px; font-size: 0.78rem;" onclick="adminTogglePlan(${u.id}, '${u.plan}')">
                ${u.plan.startsWith('pro') ? 'Rebaixar p/ Free' : 'Promover p/ Pro'}
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    const flagsContainer = document.getElementById('admin-feature-flags');
    if (flagsContainer && data.settings) {
      flagsContainer.innerHTML = data.settings.map(s => {
        const isEnabled = s.value === 'true';
        return `
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: var(--accent-text);">${escapeHtml(s.key)}</span>
                <span class="badge ${isEnabled ? 'badge-paid' : ''}" style="${!isEnabled ? 'background:var(--accent-danger-bg); color:var(--accent-danger);' : ''}">
                  ${isEnabled ? 'ATIVO (ON)' : 'INATIVO (OFF)'}
                </span>
              </div>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">${escapeHtml(s.description || '')}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <span style="font-size: 0.78rem; color: var(--text-muted);">Shift Control</span>
              <button type="button" class="${isEnabled ? 'btn-danger-outline' : 'btn-primary'}" style="padding: 5px 12px; font-size: 0.78rem;" onclick="adminToggleSetting('${s.key}', ${!isEnabled})">
                ${isEnabled ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    showToast('Erro ao carregar dados administrativos.', 'error');
  }
}

const loadAdminOverview = loadAdminDashboard;

async function adminTogglePlan(userId, currentPlan) {
  const newPlan = currentPlan.startsWith('pro') ? 'free' : 'pro_monthly';
  if (!confirm(`Alterar plano do usuário #${userId} para ${newPlan.toUpperCase()}?`)) return;

  try {
    const res = await fetch('/api/admin/overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, plan: newPlan })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Plano do usuário atualizado com sucesso!');
      loadAdminDashboard();
    } else {
      showToast(data.error || 'Erro ao alterar plano.', 'error');
    }
  } catch (err) {
    showToast('Erro de rede ao atualizar usuário.', 'error');
  }
}

async function adminToggleSetting(key, newValue) {
  try {
    const res = await fetch('/api/admin/overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_setting', key, value: String(newValue) })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message || 'Configuração atualizada com sucesso!');
      loadAdminDashboard();
    } else {
      showToast(data.error || 'Erro ao atualizar configuração.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão ao alterar flag.', 'error');
  }
}

// ==========================================================================
// MÓDULO DE WORKSPACE MULTI-USUÁRIO (ATÉ 5 USUÁRIOS POR WORKSPACE)
// ==========================================================================

let currentWorkspace = null;

async function loadWorkspace() {
  try {
    const res = await fetch('/api/workspace');
    if (!res.ok) return;
    const data = await res.json();
    const ws = data.workspace;
    const members = data.members || [];
    currentWorkspace = ws;

    const badge = document.getElementById('workspace-seats-badge');
    if (badge && ws) {
      badge.textContent = `${ws.member_count}/${ws.max_members}`;
      badge.style.background = ws.member_count >= ws.max_members ? 'var(--accent-warning)' : 'var(--accent-primary)';
    }

    const headerName = document.getElementById('ws-header-name');
    if (headerName && ws) headerName.textContent = ws.name;

    const seatsUsed = document.getElementById('ws-seats-used');
    if (seatsUsed && ws) seatsUsed.textContent = `${ws.member_count} / ${ws.max_members}`;

    const seatsStatus = document.getElementById('ws-seats-status');
    if (seatsStatus && ws) {
      seatsStatus.textContent = ws.available_seats > 0
        ? `${ws.available_seats} vaga(s) disponível(is)`
        : 'Limite máximo de 5 usuários atingido';
      seatsStatus.style.color = ws.available_seats > 0 ? 'var(--text-muted)' : 'var(--accent-warning)';
    }

    const roleLabels = { owner: 'Proprietário Titular', admin: 'Co-Administrador', member: 'Membro Colaborador' };
    const myRoleEl = document.getElementById('ws-my-role');
    if (myRoleEl && ws) myRoleEl.textContent = roleLabels[ws.current_user_role] || 'Membro';

    const capBar = document.getElementById('ws-capacity-bar');
    if (capBar && ws) {
      const pct = Math.min(100, Math.round((ws.member_count / ws.max_members) * 100));
      capBar.style.width = `${pct}%`;
      capBar.className = `progress-bar-fill ${ws.member_count >= ws.max_members ? 'progress-fill-warning' : 'progress-fill-success'}`;
    }

    const addBtn = document.getElementById('btn-add-ws-member');
    if (addBtn && ws) {
      const canManage = ws.current_user_role === 'owner' || ws.current_user_role === 'admin';
      const isFull = ws.member_count >= ws.max_members;
      addBtn.disabled = !canManage || isFull;
      addBtn.style.opacity = (!canManage || isFull) ? '0.5' : '1';
      addBtn.style.cursor = (!canManage || isFull) ? 'not-allowed' : 'pointer';
      addBtn.textContent = isFull ? 'Limite 5/5 Atingido' : '+ Adicionar Usuário';
    }

    const tbody = document.getElementById('ws-members-tbody');
    if (tbody && ws) {
      const canManage = ws.current_user_role === 'owner' || ws.current_user_role === 'admin';
      tbody.innerHTML = members.map((m, idx) => {
        const isOwner = m.member_role === 'owner' || m.id === ws.owner_id;
        const badgeClass = isOwner ? 'badge-paid' : 'badge-pending';
        return `
          <tr>
            <td><strong>#${idx + 1} / ${ws.max_members}</strong></td>
            <td><strong>${escapeHtml(m.name)}</strong></td>
            <td><span class="text-muted">${escapeHtml(m.email)}</span></td>
            <td><span class="badge ${badgeClass}">${escapeHtml(roleLabels[m.member_role] || 'Membro')}</span></td>
            <td class="text-muted">${formatDate(String(m.added_at || '').slice(0, 10))}</td>
            <td class="text-right">
              ${(!isOwner && canManage)
                ? `<button type="button" class="btn-action-icon delete" onclick="removeWorkspaceMember(${m.id}, '${escapeHtml(m.name)}')" title="Remover do Workspace">${SVG_ICONS.trash}</button>`
                : `<span class="text-muted" style="font-size:0.78rem;">Titular</span>`
              }
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Erro ao carregar workspace:', err);
  }
}

document.getElementById('form-workspace-member')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('ws-member-name').value.trim();
  const email = document.getElementById('ws-member-email').value.trim();
  const password = document.getElementById('ws-member-password').value;
  const member_role = document.getElementById('ws-member-role').value;

  try {
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_member', name, email, password, member_role })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message || 'Usuário adicionado ao workspace!', 'success');
      document.getElementById('form-workspace-member').reset();
      closeModal('modal-workspace-member');
      loadWorkspace();
    } else {
      showToast(data.error || 'Erro ao adicionar membro.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão ao adicionar membro.', 'error');
  }
});

async function renameWorkspacePrompt() {
  const currentName = currentWorkspace ? currentWorkspace.name : 'Meu Workspace';
  const newName = prompt('Novo nome do Workspace (ex: Família El-Khouri):', currentName);
  if (!newName || newName.trim() === currentName) return;

  try {
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rename', name: newName.trim() })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Workspace renomeado com sucesso!', 'success');
      loadWorkspace();
    } else {
      showToast(data.error || 'Erro ao renomear workspace.', 'error');
    }
  } catch (err) {
    showToast('Erro de rede ao renomear workspace.', 'error');
  }
}

async function removeWorkspaceMember(userId, userName) {
  if (!confirm(`Deseja remover ${userName} deste workspace? A vaga ficará disponível novamente.`)) return;

  try {
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_member', user_id: userId })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Membro removido do workspace.', 'success');
      loadWorkspace();
    } else {
      showToast(data.error || 'Erro ao remover membro.', 'error');
    }
  } catch (err) {
    showToast('Erro de rede ao remover membro.', 'error');
  }
}
