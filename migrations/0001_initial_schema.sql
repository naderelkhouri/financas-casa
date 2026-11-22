-- Schema Inicial do Cloudflare D1 (Finanças SaaS PF)
-- Compatível com SQLite / Cloudflare D1

-- 1. Usuários (SaaS)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    plan_expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Contas Bancárias & Carteiras
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'checking',
    initial_balance REAL NOT NULL DEFAULT 0.0,
    current_balance REAL NOT NULL DEFAULT 0.0,
    color TEXT DEFAULT '#10b981',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Cartões de Crédito
CREATE TABLE IF NOT EXISTS credit_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    credit_limit REAL NOT NULL DEFAULT 0.0,
    closing_day INTEGER NOT NULL DEFAULT 25,
    due_day INTEGER NOT NULL DEFAULT 5,
    color TEXT DEFAULT '#6366f1',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Categorias
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
    color TEXT NOT NULL DEFAULT '#64748b',
    icon TEXT NOT NULL DEFAULT '📁'
);

-- 5. Transações
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
    category_id INTEGER,
    account_id INTEGER,
    credit_card_id INTEGER,
    payment_method TEXT NOT NULL DEFAULT 'PIX',
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK(status IN ('paid', 'pending')),
    notes TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL
);

-- 6. Orçamentos Mensais (Budgets)
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    category_id INTEGER NOT NULL,
    monthly_limit REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 7. Metas de Poupança (Goals)
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    deadline TEXT,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '🎯',
    notes TEXT DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Contas Fixas / Recorrentes
CREATE TABLE IF NOT EXISTS recurring_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    due_day INTEGER NOT NULL CHECK(due_day BETWEEN 1 AND 31),
    payment_method TEXT DEFAULT 'PIX',
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 9. Histórico de Pagamentos de Contas Recorrentes
CREATE TABLE IF NOT EXISTS recurring_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    month_year TEXT NOT NULL,
    paid_date TEXT NOT NULL,
    transaction_id INTEGER,
    FOREIGN KEY (bill_id) REFERENCES recurring_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    UNIQUE(bill_id, month_year)
);

-- 10. Workspaces Multi-Usuário (Limite de até 5 usuários por workspace)
CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    max_members INTEGER NOT NULL DEFAULT 5 CHECK(max_members <= 5),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Membros de Workspace (Até 5 vagas por workspace)
CREATE TABLE IF NOT EXISTS workspace_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    member_role TEXT NOT NULL DEFAULT 'member' CHECK(member_role IN ('owner', 'admin', 'member')),
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(workspace_id, user_id)
);

-- 12. Configurações Globais do Sistema (Super Admin Feature Flags)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed de Categorias Básicas
INSERT OR IGNORE INTO categories (name, type, color, icon) VALUES
    ('Moradia', 'expense', '#ef4444', '🏠'),
    ('Alimentação & Mercado', 'expense', '#f97316', '🛒'),
    ('Transporte & Combustível', 'expense', '#f59e0b', '🚗'),
    ('Saúde & Farmácia', 'expense', '#10b981', '💊'),
    ('Lazer & Restaurantes', 'expense', '#06b6d4', '🍕'),
    ('Educação & Cursos', 'expense', '#3b82f6', '📚'),
    ('Assinaturas & Streaming', 'expense', '#8b5cf6', '📱'),
    ('Contas (Água, Luz, Internet)', 'expense', '#ec4899', '💡'),
    ('Vestuário & Compras', 'expense', '#64748b', '🛍️'),
    ('Outras Despesas', 'expense', '#78716c', '📦'),
    ('Salário', 'income', '#10b981', '💼'),
    ('Rendimentos & Investimentos', 'income', '#14b8a6', '📈'),
    ('Freelance & Extras', 'income', '#84cc16', '⚡'),
    ('Outras Receitas', 'income', '#22c55e', '💰');
