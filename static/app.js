/**
 * Finanças de Casa - Frontend SPA Logic & SVG Chart Engine
 * Zero dependências externas (Vanilla JavaScript).
 */

const state = {
  currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
  activeTab: 'dashboard',
  categories: [],
  transactions: [],
  summary: null,
  budgets: [],
  goals: [],
  recurringBills: []
};

// ==========================================================================
// Inicialização
// ==========================================================================

const ZOOM_LEVELS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.4, 1.6, 1.8, 2.0];
let currentZoom = parseFloat(localStorage.getItem('financas_zoom')) || 1.0;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initZoom();
  initMonthSelector();
  initEventListeners();
  checkAuthSession();
  loadInitialData();
  registerServiceWorker();
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

function initZoom() {
  applyZoom(currentZoom);

  document.getElementById('btn-zoom-in')?.addEventListener('click', () => zoomIn());
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => zoomOut());
  document.getElementById('btn-zoom-reset')?.addEventListener('click', () => zoomReset());

  // Atalhos de teclado (Ctrl +, Ctrl -, Ctrl 0)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+' || e.key === 'Add') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_' || e.key === 'Subtract') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        zoomReset();
      }
    }
  });

  // Zoom com Ctrl + Roda do Mouse
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else if (e.deltaY > 0) {
        zoomOut();
      }
    }
  }, { passive: false });
}

function zoomIn() {
  const next = ZOOM_LEVELS.find(z => z > currentZoom + 0.01);
  if (next) {
    applyZoom(next);
  } else if (currentZoom < 2.5) {
    applyZoom(Math.min(2.5, currentZoom + 0.1));
  }
}

function zoomOut() {
  const prev = [...ZOOM_LEVELS].reverse().find(z => z < currentZoom - 0.01);
  if (prev) {
    applyZoom(prev);
  } else if (currentZoom > 0.6) {
    applyZoom(Math.max(0.6, currentZoom - 0.1));
  }
}

function zoomReset() {
  applyZoom(1.0);
}

function applyZoom(zoom) {
  currentZoom = Math.round(zoom * 100) / 100;
  document.documentElement.style.zoom = currentZoom;
  document.body.style.zoom = currentZoom;
  localStorage.setItem('financas_zoom', currentZoom);
  
  const label = document.getElementById('zoom-level-label');
  if (label) {
    label.textContent = `${Math.round(currentZoom * 100)}%`;
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
    btn.innerHTML = theme === 'dark' ? '<span class="theme-icon">🌙</span>' : '<span class="theme-icon">☀️</span>';
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
  monthInput.value = state.currentMonth;

  monthInput.addEventListener('change', (e) => {
    state.currentMonth = e.target.value;
    refreshCurrentView();
  });

  document.getElementById('btn-prev-month').addEventListener('click', () => {
    changeMonth(-1);
  });

  document.getElementById('btn-next-month').addEventListener('click', () => {
    changeMonth(1);
  });
}

function changeMonth(delta) {
  const [year, month] = state.currentMonth.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  state.currentMonth = d.toISOString().slice(0, 7);
  document.getElementById('selected-month').value = state.currentMonth;
  refreshCurrentView();
}

function initEventListeners() {
  // Navegação por abas
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  // Theme toggle
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);

  // Botões de Abrir Modal
  document.getElementById('btn-open-tx-modal').addEventListener('click', () => openTransactionModal());
  document.getElementById('btn-open-budget-modal').addEventListener('click', () => openModal('modal-budget'));
  document.getElementById('btn-open-goal-modal').addEventListener('click', () => openGoalModal());
  document.getElementById('btn-open-recurring-modal').addEventListener('click', () => openModal('modal-recurring'));

  // Transações Filtros & Busca
  document.getElementById('tx-search-input').addEventListener('input', debounce(() => loadTransactions(), 300));
  document.getElementById('tx-filter-type').addEventListener('change', () => loadTransactions());
  document.getElementById('tx-filter-category').addEventListener('change', () => loadTransactions());
  document.getElementById('btn-export-csv-direct').addEventListener('click', () => exportData('csv'));

  // Forms Submit
  document.getElementById('form-transaction').addEventListener('submit', handleTransactionSubmit);
  document.getElementById('form-budget').addEventListener('submit', handleBudgetSubmit);
  document.getElementById('form-goal').addEventListener('submit', handleGoalSubmit);
  document.getElementById('form-recurring').addEventListener('submit', handleRecurringSubmit);

  // Toggle tipo despesa/receita no modal
  document.querySelectorAll('input[name="tx-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isExpense = e.target.value === 'expense';
      document.getElementById('type-btn-expense').classList.toggle('active', isExpense);
      document.getElementById('type-btn-income').classList.toggle('active', !isExpense);
      populateCategorySelect('tx-category', e.target.value);
    });
  });

  // Drag & Drop Importação CSV
  const dropzone = document.getElementById('import-dropzone');
  const fileInput = document.getElementById('csv-file-input');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-primary)';
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

// ==========================================================================
// Navegação e Roteamento SPA
// ==========================================================================

function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Atualizar botões da sidebar
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  // Atualizar painéis visíveis
  document.querySelectorAll('.tab-pane, .tab-content').forEach(pane => {
    const isTarget = pane.id === `pane-${tabId}` || pane.id === `tab-${tabId}`;
    pane.classList.toggle('active', isTarget);
    pane.style.display = isTarget ? 'block' : 'none';
  });

  // Atualizar títulos
  const titles = {
    'dashboard': { title: 'Dashboard Financeiro', sub: 'Visão consolidada do fluxo de caixa e despesas' },
    'transactions': { title: 'Extrato de Transações', sub: 'Controle detalhado de entradas e saídas' },
    'budgets-goals': { title: 'Orçamentos & Metas', sub: 'Tetos de gastos e objetivos de poupança' },
    'recurring': { title: 'Contas Recorrentes', sub: 'Lembretes de vencimento e contas fixas' },
    'accounts-cards': { title: 'Contas & Cartões', sub: 'Gestão de bancos, saldos e faturas de cartões' },
    'saas-admin': { title: 'Painel do Administrador', sub: 'Governança do SaaS, MRR e usuários da plataforma' },
    'import-ofx': { title: 'Importação OFX', sub: 'Conciliação automática de extratos bancários brasileiros' },
    'bunkerpay-sub': { title: 'Assinatura BunkerPay', sub: 'Planos Pro com liquidação direta em PIX' },
    'reports': { title: 'Relatórios & Backup', sub: 'Importação, exportação e impressão consolidada' }
  };

  if (titles[tabId]) {
    document.getElementById('page-title').textContent = titles[tabId].title;
    document.getElementById('page-subtitle').textContent = titles[tabId].sub;
  }

  // Fechar sidebar mobile se aberta
  document.getElementById('sidebar').classList.remove('open');

  refreshCurrentView();
}

function refreshCurrentView() {
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
    } else if (state.activeTab === 'saas-admin') {
      loadAdminDashboard();
    }
  });
}

async function loadInitialData() {
  await loadCategories();
  await loadDashboard();
  await updateRecurringBadge();
}

// ==========================================================================
// Carregamento de Dados da API
// ==========================================================================

async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
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
      opt.textContent = `${c.icon} ${c.name}`;
      select.appendChild(opt);
    });

  if (currentVal) select.value = currentVal;
}

// Dashboard
async function loadDashboard() {
  try {
    const res = await fetch(`/api/dashboard?month=${state.currentMonth}`);
    const data = await res.json();
    state.summary = data;

    // Atualizar Métricas Topo
    document.getElementById('dash-income').textContent = formatCurrency(data.totals.total_income);
    document.getElementById('dash-expense').textContent = formatCurrency(data.totals.total_expense);
    document.getElementById('dash-balance').textContent = formatCurrency(data.totals.balance);
    
    document.getElementById('dash-pending-income').textContent = `Pendente: ${formatCurrency(data.totals.pending_income)}`;
    document.getElementById('dash-pending-expense').textContent = `Pendente: ${formatCurrency(data.totals.pending_expense)}`;
    document.getElementById('dash-savings-rate').textContent = `Taxa de Poupança: ${data.totals.savings_rate}%`;

    // Status Orçamentos
    const exceeded = data.budgets_status.filter(b => b.spent_amount > b.monthly_limit).length;
    const alertEl = document.getElementById('dash-budget-status');
    const alertDetEl = document.getElementById('dash-budget-details');
    if (exceeded > 0) {
      alertEl.textContent = `${exceeded} Excedido(s)`;
      alertEl.style.color = 'var(--accent-danger)';
      alertDetEl.textContent = 'Atenção aos tetos de gastos';
    } else {
      alertEl.textContent = 'Dentro do Limite';
      alertEl.style.color = 'var(--accent-success)';
      alertDetEl.textContent = 'Orçamentos controlados';
    }

    // Renderizar Gráficos SVG
    renderCategoryDonut(data.expenses_by_category);
    renderMonthlyHistoryBarChart(data.monthly_history);

    // Mini Listas
    renderDashboardBudgetsMini(data.budgets_status);
    loadDashboardRecentTx();
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

// Transações
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
          ${t.tags ? `<span class="badge" style="background:var(--bg-secondary); font-size:0.7rem;">#${escapeHtml(t.tags)}</span>` : ''}
        </td>
        <td>
          <span style="display:inline-flex; align-items:center; gap:6px;">
            <span>${t.category_icon || '📁'}</span>
            <span>${escapeHtml(t.category_name || 'Geral')}</span>
          </span>
        </td>
        <td><span class="text-muted">${escapeHtml(t.payment_method || '-')}</span></td>
        <td>
          <span class="badge ${t.status === 'paid' ? 'badge-paid' : 'badge-pending'}">
            ${t.status === 'paid' ? '● Concluído' : '○ Pendente'}
          </span>
        </td>
        <td class="text-right" style="font-weight:700; color:${amountColor}; font-size:0.95rem;">
          ${amountPrefix}${formatCurrency(t.amount)}
        </td>
        <td class="text-center">
          <button class="btn-action-icon" onclick="editTransaction(${t.id})" title="Editar">✏️</button>
          <button class="btn-action-icon delete" onclick="deleteTransaction(${t.id})" title="Excluir">🗑️</button>
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
          <span class="mini-tx-icon">${t.category_icon || '📁'}</span>
          <div>
            <div style="font-weight:600;">${escapeHtml(t.description)}</div>
            <small class="text-muted">${formatDate(t.date)} • ${escapeHtml(t.category_name || 'Geral')}</small>
          </div>
        </div>
        <div style="font-weight:700; color:${color};">
          ${prefix} ${formatCurrency(t.amount)}
        </div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

// Orçamentos e Metas
async function loadBudgetsAndGoals() {
  try {
    const [bRes, gRes, sRes] = await Promise.all([
      fetch('/api/budgets'),
      fetch('/api/goals'),
      fetch(`/api/dashboard?month=${state.currentMonth}`)
    ]);
    const budgets = await bRes.json();
    const goals = await gRes.json();
    const summary = await sRes.json();

    state.budgets = budgets;
    state.goals = goals;

    // Render Orçamentos
    const bList = document.getElementById('budgets-full-list');
    bList.innerHTML = '';

    if (!summary.budgets_status.length) {
      bList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <h4>Nenhum teto configurado</h4>
          <p>Defina tetos mensais para controlar os gastos por categoria.</p>
          <button class="btn-primary" onclick="openModal('modal-budget')">Criar Primeiro Teto</button>
        </div>
      `;
    } else {
      summary.budgets_status.forEach(b => {
        const pct = Math.min(b.percentage, 100);
        let barClass = 'progress-fill-success';
        if (b.percentage > 90) barClass = 'progress-fill-danger';
        else if (b.percentage > 75) barClass = 'progress-fill-warning';

        const item = document.createElement('div');
        item.className = 'budget-item';
        item.innerHTML = `
          <div class="budget-item-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span>${b.category_icon}</span>
              <span>${escapeHtml(b.category_name)}</span>
            </div>
            <div>
              <span style="font-weight:700;">${formatCurrency(b.spent_amount)}</span> / 
              <span class="text-muted">${formatCurrency(b.monthly_limit)}</span>
              <span style="font-size:0.8rem; margin-left:6px; color:${b.percentage > 100 ? 'var(--accent-danger)' : 'var(--text-secondary)'}">(${b.percentage}%)</span>
              <button class="btn-action-icon delete" onclick="deleteBudget(${b.budget_id})" title="Remover Teto" style="margin-left:8px;">🗑️</button>
            </div>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${barClass}" style="width: ${pct}%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);">
            <span>${b.remaining >= 0 ? `Restante: ${formatCurrency(b.remaining)}` : `<strong style="color:var(--accent-danger)">Estourou por ${formatCurrency(Math.abs(b.remaining))}</strong>`}</span>
          </div>
        `;
        bList.appendChild(item);
      });
    }

    // Render Metas
    const gList = document.getElementById('goals-list');
    gList.innerHTML = '';

    if (!goals.length) {
      gList.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🏆</div>
          <h4>Nenhuma meta cadastrada</h4>
          <p>Crie metas de economia para acompanhar seus sonhos.</p>
          <button class="btn-primary" onclick="openGoalModal()">Criar Meta</button>
        </div>
      `;
    } else {
      goals.forEach(g => {
        const pct = Math.min(g.percentage, 100);
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
          <div class="goal-card-header">
            <div class="goal-title-wrapper">
              <span class="goal-icon">${g.icon || '🎯'}</span>
              <div>
                <div class="goal-title">${escapeHtml(g.title)}</div>
                ${g.deadline ? `<small class="text-muted">Prazo: ${formatDate(g.deadline)}</small>` : ''}
              </div>
            </div>
            <div>
              <button class="btn-action-icon" onclick="editGoal(${g.id})" title="Editar">✏️</button>
              <button class="btn-action-icon delete" onclick="deleteGoal(${g.id})" title="Excluir">🗑️</button>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:700; margin-top:4px;">
            <span style="color:var(--accent-primary);">${formatCurrency(g.current_amount)}</span>
            <span class="text-muted">${formatCurrency(g.target_amount)}</span>
          </div>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill progress-fill-success" style="width: ${pct}%;"></div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);">
            <span>Progresso: <strong>${g.percentage}%</strong></span>
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

  if (!budgets.length) {
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
        <span>${b.category_icon} ${escapeHtml(b.category_name)}</span>
        <span>${formatCurrency(b.spent_amount)} / ${formatCurrency(b.monthly_limit)}</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill ${barClass}" style="width: ${pct}%;"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Contas Recorrentes
async function loadRecurringBills() {
  try {
    const res = await fetch(`/api/recurring?month=${state.currentMonth}`);
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
          <span>${b.category_icon || '📁'} ${escapeHtml(b.category_name || 'Geral')}</span>
        </td>
        <td style="font-weight:700;">${formatCurrency(b.amount)}</td>
        <td><span class="text-muted">${escapeHtml(b.payment_method || 'PIX')}</span></td>
        <td>
          <span class="badge badge-${b.status_class}">
            ${b.status_label}
          </span>
        </td>
        <td class="text-center">
          ${b.is_paid 
            ? `<button class="btn-secondary" onclick="unpayRecurringBill(${b.id})" style="font-size:0.75rem; padding:4px 8px;">↩ Desmarcar</button>`
            : `<button class="btn-primary" onclick="payRecurringBill(${b.id})" style="font-size:0.75rem; padding:4px 8px;">✓ Pagar no Mês</button>`
          }
          <button class="btn-action-icon delete" onclick="deleteRecurringBill(${b.id})" title="Excluir" style="margin-left:6px;">🗑️</button>
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
    const bills = await res.json();
    const pendingCount = bills.filter(b => !b.is_paid).length;
    const badge = document.getElementById('recurring-badge');
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
// Ações e Handlers
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
    let res;
    if (txId) {
      res = await fetch(`/api/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

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

// Orçamentos
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

// Metas
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
    let res;
    if (goalId) {
      res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

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
  document.getElementById('goal-icon').value = g.icon || '🎯';
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

// Contas Fixas
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

// Exportação / Importação / Reset
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
// SVG Chart Rendering Engine (Pure Mathematical Vector Drawing)
// ==========================================================================

function renderCategoryDonut(categories) {
  const container = document.getElementById('category-donut-container');
  const legend = document.getElementById('category-legend');
  container.innerHTML = '';
  legend.innerHTML = '';

  const total = categories.reduce((sum, c) => sum + c.total_amount, 0);

  if (total === 0 || !categories.length) {
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

  categories.forEach(c => {
    const percentage = c.total_amount / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;

    svgPaths += `
      <circle cx="${cx}" cy="${cy}" r="${radius}" 
        fill="none" 
        stroke="${c.color || '#64748b'}" 
        stroke-width="${strokeWidth}" 
        stroke-dasharray="${strokeDasharray}" 
        stroke-dashoffset="${strokeDashoffset}" 
        style="transition: stroke-dasharray 0.5s ease;"
      />
    `;

    currentOffset += percentage * circumference;

    // Legenda
    const pctLabel = (percentage * 100).toFixed(1);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-name">
        <span class="legend-color-dot" style="background-color:${c.color};"></span>
        <span>${c.icon} ${escapeHtml(c.name)}</span>
      </div>
      <div class="legend-value">${formatCurrency(c.total_amount)} <span class="text-muted" style="font-size:0.75rem; font-weight:normal;">(${pctLabel}%)</span></div>
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
  container.innerHTML = '';

  if (!history || !history.length) {
    container.innerHTML = '<p class="text-muted" style="text-align:center; padding-top:80px;">Sem histórico suficiente.</p>';
    return;
  }

  const width = container.clientWidth || 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const maxVal = Math.max(...history.flatMap(h => [h.income, h.expense]), 1000);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barGroupWidth = chartWidth / history.length;
  const barWidth = Math.max(12, Math.min(24, (barGroupWidth - 20) / 2));

  let barsSvg = '';
  let labelsSvg = '';

  history.forEach((h, idx) => {
    const groupX = padding.left + idx * barGroupWidth;
    
    // Bar Receitas
    const incomeHeight = (h.income / maxVal) * chartHeight;
    const incomeY = padding.top + (chartHeight - incomeHeight);
    const incomeX = groupX + (barGroupWidth / 2) - barWidth - 2;

    // Bar Despesas
    const expenseHeight = (h.expense / maxVal) * chartHeight;
    const expenseY = padding.top + (chartHeight - expenseHeight);
    const expenseX = groupX + (barGroupWidth / 2) + 2;

    // Mês Label
    const monthLabel = h.month_period.slice(5); // MM

    barsSvg += `
      <rect x="${incomeX}" y="${incomeY}" width="${barWidth}" height="${incomeHeight}" rx="4" fill="var(--accent-success)" opacity="0.9">
        <title>Receitas (${h.month_period}): ${formatCurrency(h.income)}</title>
      </rect>
      <rect x="${expenseX}" y="${expenseY}" width="${barWidth}" height="${expenseHeight}" rx="4" fill="var(--accent-danger)" opacity="0.9">
        <title>Despesas (${h.month_period}): ${formatCurrency(h.expense)}</title>
      </rect>
    `;

    labelsSvg += `
      <text x="${groupX + barGroupWidth / 2}" y="${height - 12}" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-weight="600">
        ${monthLabel}
      </text>
    `;
  });

  container.innerHTML = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Linhas Guia de Fundo -->
      <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="var(--border-color)" stroke-dasharray="3" />
      <line x1="${padding.left}" y1="${padding.top + chartHeight / 2}" x2="${width - padding.right}" y2="${padding.top + chartHeight / 2}" stroke="var(--border-color)" stroke-dasharray="3" />
      <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="var(--border-color)" />
      
      <!-- Barras -->
      ${barsSvg}
      <!-- Labels -->
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
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠️'}</span> <span>${escapeHtml(message)}</span>`;
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
    const accounts = await accRes.json();
    const cards = await cardRes.json();

    const accContainer = document.getElementById('accounts-list');
    if (accContainer) {
      if (accounts.length === 0) {
        accContainer.innerHTML = '<p class="text-muted">Nenhuma conta cadastrada.</p>';
      } else {
        accContainer.innerHTML = accounts.map(a => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border); margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${a.color};"></span>
              <div>
                <strong>${escapeHtml(a.name)}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${a.account_type}</div>
              </div>
            </div>
            <strong style="color: var(--accent);">${formatCurrency(a.current_balance)}</strong>
          </div>
        `).join('');
      }
    }

    const cardsContainer = document.getElementById('cards-list');
    if (cardsContainer) {
      if (cards.length === 0) {
        cardsContainer.innerHTML = '<p class="text-muted">Nenhum cartão cadastrado.</p>';
      } else {
        const today = new Date().getDate();
        cardsContainer.innerHTML = cards.map(c => {
          const limit = Number(c.credit_limit) || 0;
          const closing = Number(c.closing_day) || 25;
          const due = Number(c.due_day) || 5;
          const bestDay = closing === 1 ? 28 : (closing + 1 > 31 ? 1 : closing + 1);
          const isBestDayPeriod = today >= closing || today <= (closing + 3);

          return `
          <div class="credit-card-glass">
            <div class="credit-card-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${c.color || 'var(--accent-primary)'}; box-shadow: 0 0 8px ${c.color || 'var(--accent-primary)'};"></span>
                <div>
                  <div class="credit-card-name">${escapeHtml(c.name)}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Mastercard / Visa / Platinum</div>
                </div>
              </div>
              <div class="best-purchase-day-badge" title="Compras feitas a partir deste dia caem na fatura do mês seguinte!">
                ⭐ Melhor dia: ${bestDay}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px;">
              <div>
                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Limite Total</div>
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums;">${formatCurrency(limit)}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Status do Ciclo</div>
                <div style="font-size: 0.82rem; font-weight: 600; color: ${isBestDayPeriod ? 'var(--accent-success)' : 'var(--text-secondary)'};">
                  ${isBestDayPeriod ? '🟢 Período Ouro (Fatura Seguinte)' : '🟡 Fatura Atual Aberta'}
                </div>
              </div>
            </div>

            <div class="credit-limit-bar-bg">
              <div class="credit-limit-bar-fill" style="width: 15%; background: var(--accent-primary);"></div>
            </div>

            <div class="credit-card-dates">
              <div>📅 Fecha todo dia <strong>${closing}</strong></div>
              <div>💳 Vence todo dia <strong>${due}</strong></div>
            </div>
          </div>
        `}).join('');
      }
    }
  } catch (err) {
    console.error('Erro ao carregar contas/cartões:', err);
  }
}

// Criação de Conta
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

// Criação de Cartão
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

// Processamento de OFX
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
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 16px; border-radius: 8px; color: #10b981;">
            <h4>✓ Extrato Importado com Sucesso!</h4>
            <p style="margin-top: 8px; color: var(--text);">Foram importadas <strong>${data.imported_count}</strong> transações do Banco (${data.bank_id || 'Brasileiro'}).</p>
          </div>
        `;
        showToast(`${data.imported_count} lançamentos adicionados via OFX!`);
        if (typeof loadTransactions === 'function') loadTransactions();
      } else {
        resultDiv.innerHTML = `<p style="color: #ef4444;">Erro: ${data.error}</p>`;
      }
    } catch (err) {
      resultDiv.innerHTML = `<p style="color: #ef4444;">Erro ao enviar arquivo para o servidor.</p>`;
    }
  };
  reader.readAsText(file);
}

// Checkout BunkerPay
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
      <div style="font-size: 1.1rem; margin-bottom: 12px;">Valor: <strong>R$ ${charge.amount.toFixed(2)}</strong></div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Escaneie o QR Code ou copie a chave Pix abaixo para liquidação direta via BunkerPay:</p>
      <textarea readonly style="width: 100%; height: 90px; padding: 8px; font-family: monospace; font-size: 0.75rem; background: var(--bg-card); color: var(--text); border: 1px solid var(--border); border-radius: 4px; resize: none;">${charge.pix_copy_paste}</textarea>
      <button class="btn-primary mt-3" style="width: 100%;" onclick="navigator.clipboard.writeText('${charge.pix_copy_paste}'); showToast('Código Pix copiado!');">
        Copiar Código Pix
      </button>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 12px;">Liquidação instantânea & privacidade patrimonial garantida.</div>
    `;

    openModal('bunkerpay-pix-modal');
  } catch (err) {
    showToast('Erro ao gerar cobrança BunkerPay', 'error');
  }
}

// ==========================================================================
// MÓDULO DE AUTENTICAÇÃO SEGURA (CLIENT-SIDE)
// ==========================================================================

let authState = {
  mode: 'login', // 'login' ou 'register'
  user: null
};

async function checkAuthSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        authState.user = data.user;
        updateUserUI(data.user);
        return;
      }
    }
    updateUserUI(null);
  } catch (err) {
    updateUserUI(null);
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
    if (planEl) planEl.textContent = (user.role === 'admin' ? '🛡️ Admin • ' : '') + (user.plan || 'Free');
    if (avatarEl) avatarEl.textContent = (user.name || user.email)[0].toUpperCase();
    if (btnAuth) {
      btnAuth.textContent = '🚪';
      btnAuth.title = 'Sair da Conta (Logout)';
    }
    // Exibe o botão de Admin caso tenha role admin
    if (adminNav) {
      adminNav.style.display = user.role === 'admin' ? 'flex' : 'none';
    }
  } else {
    if (nameEl) nameEl.textContent = 'Visitante';
    if (planEl) planEl.textContent = 'Não Autenticado';
    if (avatarEl) avatarEl.textContent = '?';
    if (btnAuth) {
      btnAuth.textContent = '🔑';
      btnAuth.title = 'Entrar / Cadastrar';
    }
    if (adminNav) adminNav.style.display = 'none';
  }
}

// ==========================================================================
// PAINEL ADMINISTRATIVO DO SAAS (CARREGAMENTO & GESTÃO)
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

    // Atualizar Métricas
    document.getElementById('admin-total-users').textContent = m.total_users || 0;
    document.getElementById('admin-free-users').textContent = `${m.free_users || 0} no plano gratuito`;
    document.getElementById('admin-pro-users').textContent = m.pro_subscribers || 0;
    document.getElementById('admin-mrr').textContent = formatCurrency(m.estimated_mrr || 0);
    document.getElementById('admin-tx-count').textContent = m.total_transactions || 0;
    document.getElementById('admin-volume').textContent = `${formatCurrency(m.total_financial_volume || 0)} movimentados`;

    // Renderizar Tabela de Usuários
    const tbody = document.getElementById('admin-users-table-body');
    if (tbody) {
      if (!data.users || data.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 24px; text-align: center; color: var(--text-muted);">Nenhum usuário cadastrado.</td></tr>';
        return;
      }

      tbody.innerHTML = data.users.map(u => `
        <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <td style="padding: 12px 16px; font-weight: 600;">#${u.id}</td>
          <td style="padding: 12px 16px;">
            <strong>${escapeHtml(u.name)}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(u.email)}</div>
          </td>
          <td style="padding: 12px 16px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; background: ${u.plan.startsWith('pro') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)'}; color: ${u.plan.startsWith('pro') ? '#10b981' : 'var(--text-muted)'};">
              ${u.plan.toUpperCase()}
            </span>
          </td>
          <td style="padding: 12px 16px;">
            <span style="font-weight: 600; color: ${u.role === 'admin' ? 'var(--accent-warning)' : 'inherit'};">
              ${u.role === 'admin' ? '🛡️ Admin' : 'Usuário'}
            </span>
          </td>
          <td style="padding: 12px 16px;">
            <span>${u.tx_count || 0} lançamentos</span>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${u.accounts_count || 0} contas</div>
          </td>
          <td style="padding: 12px 16px; color: var(--text-muted); font-size: 0.78rem;">
            ${formatDate(String(u.created_at || '').slice(0, 10))}
          </td>
          <td style="padding: 12px 16px; text-align: right;">
            <button class="btn-ghost" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminTogglePlan(${u.id}, '${u.plan}')">
              ${u.plan.startsWith('pro') ? 'Rebaixar p/ Free' : 'Promover p/ Pro'}
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    showToast('Erro ao carregar dados administrativos.', 'error');
  }
}

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

function handleAuthClick() {
  if (authState.user) {
    if (confirm('Deseja realmente encerrar a sessão?')) {
      logoutUser();
    }
  } else {
    switchAuthMode('login');
    openModal('modal-auth');
  }
}

function switchAuthMode(mode) {
  authState.mode = mode;
  const isRegister = mode === 'register';

  document.getElementById('auth-tab-login')?.classList.toggle('active', !isRegister);
  document.getElementById('auth-tab-register')?.classList.toggle('active', isRegister);
  
  const title = document.getElementById('auth-modal-title');
  const nameGroup = document.getElementById('auth-group-name');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (title) title.textContent = isRegister ? 'Criar Nova Conta' : 'Acessar Minha Conta';
  if (nameGroup) nameGroup.style.display = isRegister ? 'block' : 'none';
  if (submitBtn) submitBtn.textContent = isRegister ? 'Criar Conta Segura' : 'Entrar com Segurança';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value;

  const endpoint = authState.mode === 'register' ? '/api/auth/register' : '/api/auth/login';
  const payload = authState.mode === 'register' ? { name, email, password } : { email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(authState.mode === 'register' ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
      authState.user = data.user;
      updateUserUI(data.user);
      closeModal('modal-auth');
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
    refreshCurrentView();
  } catch (err) {
    showToast('Erro ao sair da conta.', 'error');
  }
}

// Quick Capture - Lançamento Rápido em 3 Segundos
function openQuickTransaction() {
  const modal = document.getElementById('modal-transaction');
  if (!modal) return;
  
  // Limpa formulário e prepara para entrada ultra-rápida
  const form = document.getElementById('form-transaction');
  if (form) form.reset();
  
  const idField = document.getElementById('tx-id');
  if (idField) idField.value = '';

  const titleField = document.getElementById('modal-tx-title');
  if (titleField) titleField.textContent = '⚡ Lançamento Rápido';

  const dateField = document.getElementById('tx-date');
  if (dateField) dateField.value = new Date().toISOString().split('T')[0];

  const expenseBtn = document.getElementById('type-btn-expense');
  if (expenseBtn) {
    document.querySelectorAll('.tx-type-toggle-group .type-btn').forEach(b => b.classList.remove('active'));
    expenseBtn.classList.add('active');
    const radio = expenseBtn.querySelector('input');
    if (radio) radio.checked = true;
  }

  modal.style.display = 'flex';

  // Foco imediato no campo de valor para digitação sem clique extra
  setTimeout(() => {
    const amountField = document.getElementById('tx-amount');
    if (amountField) {
      amountField.focus();
      amountField.select();
    }
  }, 100);
}

// Atalho de teclado: Pressionar 'N' abre o lançamento rápido (quando não estiver digitando em inputs)
document.addEventListener('keydown', (e) => {
  if (e.key === 'n' || e.key === 'N') {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
      return;
    }
    e.preventDefault();
    openQuickTransaction();
  }
});



