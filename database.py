"""
Módulo de Banco de Dados SQLite para o Gerenciador de Finanças Domésticas.
Zero dependências externas (utiliza sqlite3 nativo do Python).
"""

import sqlite3
import os
import json
from datetime import datetime, date
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "financas.db")

DEFAULT_CATEGORIES = [
    # Despesas
    {"name": "Moradia", "type": "expense", "color": "#ef4444", "icon": "🏠"},
    {"name": "Alimentação & Mercado", "type": "expense", "color": "#f97316", "icon": "🛒"},
    {"name": "Transporte & Combustível", "type": "expense", "color": "#f59e0b", "icon": "🚗"},
    {"name": "Saúde & Farmácia", "type": "expense", "color": "#10b981", "icon": "💊"},
    {"name": "Lazer & Restaurantes", "type": "expense", "color": "#06b6d4", "icon": "🍕"},
    {"name": "Educação & Cursos", "type": "expense", "color": "#3b82f6", "icon": "📚"},
    {"name": "Assinaturas & Streaming", "type": "expense", "color": "#8b5cf6", "icon": "📱"},
    {"name": "Contas (Água, Luz, Internet)", "type": "expense", "color": "#ec4899", "icon": "💡"},
    {"name": "Vestuário & Compras", "type": "expense", "color": "#64748b", "icon": "🛍️"},
    {"name": "Outras Despesas", "type": "expense", "color": "#78716c", "icon": "📦"},
    # Receitas
    {"name": "Salário", "type": "income", "color": "#10b981", "icon": "💼"},
    {"name": "Rendimentos & Investimentos", "type": "income", "color": "#14b8a6", "icon": "📈"},
    {"name": "Freelance & Extras", "type": "income", "color": "#84cc16", "icon": "⚡"},
    {"name": "Outras Receitas", "type": "income", "color": "#22c55e", "icon": "💰"},
]

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Tabela de Usuários (SaaS)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        plan_expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Tabela de Contas Bancárias (SaaS PF)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'checking',
        initial_balance REAL NOT NULL DEFAULT 0.0,
        current_balance REAL NOT NULL DEFAULT 0.0,
        color TEXT DEFAULT '#10b981',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Tabela de Cartões de Crédito (SaaS PF)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS credit_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        credit_limit REAL NOT NULL DEFAULT 0.0,
        closing_day INTEGER NOT NULL DEFAULT 25,
        due_day INTEGER NOT NULL DEFAULT 5,
        color TEXT DEFAULT '#6366f1',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Tabela de Categorias
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
        color TEXT NOT NULL DEFAULT '#64748b',
        icon TEXT NOT NULL DEFAULT '📁'
    );
    """)

    # Tabela de Transações
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
        category_id INTEGER,
        payment_method TEXT NOT NULL DEFAULT 'PIX',
        date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'paid' CHECK(status IN ('paid', 'pending')),
        notes TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    """)

    # Tabela de Orçamentos Mensais
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL UNIQUE,
        monthly_limit REAL NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
    """)

    # Tabela de Metas de Economia
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        deadline TEXT,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT '🎯',
        notes TEXT DEFAULT ''
    );
    """)

    # Tabela de Contas Fixas / Recorrentes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recurring_bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER,
        due_day INTEGER NOT NULL CHECK(due_day BETWEEN 1 AND 31),
        payment_method TEXT DEFAULT 'PIX',
        active INTEGER NOT NULL DEFAULT 1,
        notes TEXT DEFAULT '',
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    """)

    # Tabela de Registro de Pagamento de Contas Recorrentes
    cursor.execute("""
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
    """)

    conn.commit()

    # Inserir categorias padrão se a tabela estiver vazia
    cursor.execute("SELECT COUNT(*) as count FROM categories;")
    if cursor.fetchone()["count"] == 0:
        for cat in DEFAULT_CATEGORIES:
            cursor.execute(
                "INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)",
                (cat["name"], cat["type"], cat["color"], cat["icon"])
            )
        conn.commit()
        seed_sample_data(conn)

    conn.close()

def seed_sample_data(conn: sqlite3.Connection):
    """Insere dados iniciais para demonstração amigável e clara."""
    cursor = conn.cursor()
    today = date.today()
    current_month_str = today.strftime("%Y-%m")
    
    # Obter IDs de categorias
    cursor.execute("SELECT id, name FROM categories;")
    cat_map = {row["name"]: row["id"] for row in cursor.fetchall()}

    # Transações de exemplo para o mês atual
    sample_transactions = [
        # Receitas
        ("Salário Mensal", 6500.00, "income", cat_map.get("Salário"), "Transferência", f"{current_month_str}-05", "paid", "Salário líquido"),
        ("Rendimentos CDB", 240.50, "income", cat_map.get("Rendimentos & Investimentos"), "Transferência", f"{current_month_str}-10", "paid", "Rendimento mensal da reserva"),
        ("Projeto Freelance UI", 1200.00, "income", cat_map.get("Freelance & Extras"), "PIX", f"{current_month_str}-12", "paid", "Design de dashboard"),
        # Despesas
        ("Aluguel do Apartamento", 2200.00, "expense", cat_map.get("Moradia"), "PIX", f"{current_month_str}-05", "paid", "Aluguel + Condomínio"),
        ("Supermercado Semanal", 580.40, "expense", cat_map.get("Alimentação & Mercado"), "Cartão de Débito", f"{current_month_str}-06", "paid", "Compras do mês"),
        ("Conta de Energia (Luz)", 195.30, "expense", cat_map.get("Contas (Água, Luz, Internet)"), "Boleto", f"{current_month_str}-10", "paid", "Referente ao mês anterior"),
        ("Internet Fibra 500MB", 129.90, "expense", cat_map.get("Contas (Água, Luz, Internet)"), "Cartão de Crédito", f"{current_month_str}-15", "paid", "Fatura mensal"),
        ("Combustível Carro", 220.00, "expense", cat_map.get("Transporte & Combustível"), "Cartão de Crédito", f"{current_month_str}-08", "paid", "Tanque cheio"),
        ("Jantar no Restaurante", 165.00, "expense", cat_map.get("Lazer & Restaurantes"), "Cartão de Crédito", f"{current_month_str}-11", "paid", "Pizzaria com a família"),
        ("Assinatura Netflix & Spotify", 79.80, "expense", cat_map.get("Assinaturas & Streaming"), "Cartão de Crédito", f"{current_month_str}-14", "paid", "Serviços digitais"),
        ("Farmácia e Vitaminas", 94.50, "expense", cat_map.get("Saúde & Farmácia"), "PIX", f"{current_month_str}-13", "paid", "Suplementos"),
    ]

    for t in sample_transactions:
        cursor.execute("""
        INSERT INTO transactions (description, amount, type, category_id, payment_method, date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, t)

    # Orçamentos de exemplo
    sample_budgets = [
        (cat_map.get("Alimentação & Mercado"), 1600.00),
        (cat_map.get("Moradia"), 2500.00),
        (cat_map.get("Transporte & Combustível"), 600.00),
        (cat_map.get("Lazer & Restaurantes"), 500.00),
        (cat_map.get("Contas (Água, Luz, Internet)"), 450.00),
    ]
    for b in sample_budgets:
        if b[0]:
            cursor.execute("INSERT OR REPLACE INTO budgets (category_id, monthly_limit) VALUES (?, ?)", b)

    # Metas de exemplo
    sample_goals = [
        ("Reserva de Emergência (6 Meses)", 25000.00, 14500.00, f"{today.year + 1}-12-31", "#10b981", "🛡️", "Meta de segurança financeira familiar"),
        ("Viagem de Férias", 8000.00, 3200.00, f"{today.year}-12-15", "#3b82f6", "✈️", "Viagem no final do ano"),
        ("Troca do Notebook de Trabalho", 5500.00, 2000.00, f"{today.year}-10-30", "#8b5cf6", "💻", "Equipamento para desenvolvimento"),
    ]
    for g in sample_goals:
        cursor.execute("""
        INSERT INTO goals (title, target_amount, current_amount, deadline, color, icon, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, g)

    # Contas fixas recorrentes
    sample_recurring = [
        ("Aluguel + Condomínio", 2200.00, cat_map.get("Moradia"), 5, "PIX", "Vencimento todo dia 05"),
        ("Conta de Luz (Enel)", 190.00, cat_map.get("Contas (Água, Luz, Internet)"), 10, "Boleto", "Débito em conta ou boleto"),
        ("Internet Fibra", 129.90, cat_map.get("Contas (Água, Luz, Internet)"), 15, "Cartão de Crédito", "Cartão recorrente"),
        ("Plano de Saúde", 380.00, cat_map.get("Saúde & Farmácia"), 20, "Boleto", "Mensalidade do convênio"),
        ("Netflix + Spotify", 79.80, cat_map.get("Assinaturas & Streaming"), 14, "Cartão de Crédito", "Cobrança automática"),
    ]
    for r in sample_recurring:
        cursor.execute("""
        INSERT INTO recurring_bills (description, amount, category_id, due_day, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        """, r)

    conn.commit()

# Funções CRUD e Consultas Analíticas

def get_categories():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY type DESC, name ASC;")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_category(name: str, cat_type: str, color: str, icon: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)",
        (name.strip(), cat_type, color, icon)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def get_transactions(month: Optional[str] = None, cat_id: Optional[int] = None, tx_type: Optional[str] = None, search: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = """
        SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE 1=1
    """
    params = []
    if month:
        query += " AND t.date LIKE ?"
        params.append(f"{month}%")
    if cat_id:
        query += " AND t.category_id = ?"
        params.append(cat_id)
    if tx_type:
        query += " AND t.type = ?"
        params.append(tx_type)
    if search:
        query += " AND (t.description LIKE ? OR t.notes LIKE ? OR t.tags LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
    
    query += " ORDER BY t.date DESC, t.id DESC;"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_transaction(description: str, amount: float, tx_type: str, category_id: Optional[int], payment_method: str, tx_date: str, status: str = 'paid', notes: str = '', tags: str = ''):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO transactions (description, amount, type, category_id, payment_method, date, status, notes, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (description.strip(), float(amount), tx_type, category_id, payment_method, tx_date, status, notes, tags))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def update_transaction(tx_id: int, description: str, amount: float, tx_type: str, category_id: Optional[int], payment_method: str, tx_date: str, status: str = 'paid', notes: str = '', tags: str = ''):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE transactions
        SET description = ?, amount = ?, type = ?, category_id = ?, payment_method = ?, date = ?, status = ?, notes = ?, tags = ?
        WHERE id = ?
    """, (description.strip(), float(amount), tx_type, category_id, payment_method, tx_date, status, notes, tags, tx_id))
    conn.commit()
    conn.close()
    return True

def delete_transaction(tx_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    conn.commit()
    conn.close()
    return True

def get_dashboard_summary(month: Optional[str] = None):
    if not month:
        month = date.today().strftime("%Y-%m")
    
    conn = get_connection()
    cursor = conn.cursor()

    # Totais do mês
    cursor.execute("""
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as total_expense,
            COALESCE(SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_income,
            COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_expense
        FROM transactions
        WHERE date LIKE ?;
    """, (f"{month}%",))
    totals = dict(cursor.fetchone())
    totals["balance"] = totals["total_income"] - totals["total_expense"]
    totals["savings_rate"] = round(((totals["balance"] / totals["total_income"]) * 100), 1) if totals["total_income"] > 0 else 0.0

    # Despesas por categoria
    cursor.execute("""
        SELECT 
            c.id, c.name, c.color, c.icon,
            COALESCE(SUM(t.amount), 0) as total_amount,
            COUNT(t.id) as tx_count
        FROM categories c
        JOIN transactions t ON t.category_id = c.id
        WHERE t.type = 'expense' AND t.date LIKE ?
        GROUP BY c.id
        ORDER BY total_amount DESC;
    """, (f"{month}%",))
    expenses_by_category = [dict(r) for r in cursor.fetchall()]

    # Evolução diária no mês
    cursor.execute("""
        SELECT 
            t.date,
            COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expense
        FROM transactions t
        WHERE t.date LIKE ?
        GROUP BY t.date
        ORDER BY t.date ASC;
    """, (f"{month}%",))
    daily_evolution = [dict(r) for r in cursor.fetchall()]

    # Histórico dos últimos 6 meses
    cursor.execute("""
        SELECT 
            strftime('%Y-%m', date) as month_period,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM transactions
        GROUP BY month_period
        ORDER BY month_period DESC
        LIMIT 6;
    """)
    monthly_history = [dict(r) for r in cursor.fetchall()]
    monthly_history.reverse()

    # Orçamentos vs Gastos do mês
    cursor.execute("""
        SELECT 
            b.id as budget_id,
            b.monthly_limit,
            c.id as category_id,
            c.name as category_name,
            c.color as category_color,
            c.icon as category_icon,
            COALESCE((
                SELECT SUM(t.amount) 
                FROM transactions t 
                WHERE t.category_id = c.id AND t.type = 'expense' AND t.date LIKE ?
            ), 0) as spent_amount
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        ORDER BY spent_amount DESC;
    """, (f"{month}%",))
    budgets_status = []
    for row in cursor.fetchall():
        b_dict = dict(row)
        b_dict["percentage"] = round((b_dict["spent_amount"] / b_dict["monthly_limit"]) * 100, 1) if b_dict["monthly_limit"] > 0 else 0
        b_dict["remaining"] = round(b_dict["monthly_limit"] - b_dict["spent_amount"], 2)
        budgets_status.append(b_dict)

    # Metas de economia
    cursor.execute("SELECT * FROM goals ORDER BY current_amount / target_amount DESC;")
    goals = []
    for row in cursor.fetchall():
        g_dict = dict(row)
        g_dict["percentage"] = round((g_dict["current_amount"] / g_dict["target_amount"]) * 100, 1) if g_dict["target_amount"] > 0 else 0
        goals.append(g_dict)

    conn.close()
    return {
        "month": month,
        "totals": totals,
        "expenses_by_category": expenses_by_category,
        "daily_evolution": daily_evolution,
        "monthly_history": monthly_history,
        "budgets_status": budgets_status,
        "goals": goals
    }

def get_budgets():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        ORDER BY c.name ASC;
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def save_budget(category_id: int, monthly_limit: float):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO budgets (category_id, monthly_limit)
        VALUES (?, ?)
        ON CONFLICT(category_id) DO UPDATE SET monthly_limit = excluded.monthly_limit;
    """, (category_id, float(monthly_limit)))
    conn.commit()
    conn.close()
    return True

def delete_budget(budget_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM budgets WHERE id = ?", (budget_id,))
    conn.commit()
    conn.close()
    return True

def get_goals():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM goals ORDER BY id ASC;")
    rows = [dict(r) for r in cursor.fetchall()]
    for r in rows:
        r["percentage"] = round((r["current_amount"] / r["target_amount"]) * 100, 1) if r["target_amount"] > 0 else 0
    conn.close()
    return rows

def add_goal(title: str, target_amount: float, current_amount: float, deadline: str, color: str, icon: str, notes: str = ''):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO goals (title, target_amount, current_amount, deadline, color, icon, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (title.strip(), float(target_amount), float(current_amount), deadline, color, icon, notes))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def update_goal(goal_id: int, title: str, target_amount: float, current_amount: float, deadline: str, color: str, icon: str, notes: str = ''):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE goals
        SET title = ?, target_amount = ?, current_amount = ?, deadline = ?, color = ?, icon = ?, notes = ?
        WHERE id = ?
    """, (title.strip(), float(target_amount), float(current_amount), deadline, color, icon, notes, goal_id))
    conn.commit()
    conn.close()
    return True

def delete_goal(goal_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
    conn.commit()
    conn.close()
    return True

def get_recurring_bills(month: Optional[str] = None):
    if not month:
        month = date.today().strftime("%Y-%m")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            r.*, 
            c.name as category_name, c.color as category_color, c.icon as category_icon,
            p.id as payment_id, p.paid_date, p.transaction_id
        FROM recurring_bills r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN recurring_payments p ON p.bill_id = r.id AND p.month_year = ?
        WHERE r.active = 1
        ORDER BY r.due_day ASC;
    """, (month,))
    
    today_day = date.today().day
    is_current_month = (month == date.today().strftime("%Y-%m"))

    bills = []
    for row in cursor.fetchall():
        b = dict(row)
        b["is_paid"] = b["payment_id"] is not None
        
        if b["is_paid"]:
            b["status_label"] = "Pago"
            b["status_class"] = "paid"
        elif is_current_month:
            if today_day > b["due_day"]:
                b["status_label"] = f"Atrasado ({today_day - b["due_day"]}d)"
                b["status_class"] = "overdue"
            elif today_day == b["due_day"]:
                b["status_label"] = "Vence Hoje!"
                b["status_class"] = "today"
            else:
                b["status_label"] = f"Em {b["due_day"] - today_day} dias"
                b["status_class"] = "pending"
        else:
            b["status_label"] = "Pendente"
            b["status_class"] = "pending"
        
        bills.append(b)

    conn.close()
    return bills

def add_recurring_bill(description: str, amount: float, category_id: Optional[int], due_day: int, payment_method: str = 'PIX', notes: str = ''):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO recurring_bills (description, amount, category_id, due_day, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (description.strip(), float(amount), category_id, int(due_day), payment_method, notes))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def delete_recurring_bill(bill_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recurring_bills WHERE id = ?", (bill_id,))
    conn.commit()
    conn.close()
    return True

def pay_recurring_bill(bill_id: int, month_year: str, create_transaction: bool = True):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM recurring_bills WHERE id = ?", (bill_id,))
    bill = cursor.fetchone()
    if not bill:
        conn.close()
        return None

    today_str = date.today().strftime("%Y-%m-%d")
    tx_id = None

    if create_transaction:
        cursor.execute("""
            INSERT INTO transactions (description, amount, type, category_id, payment_method, date, status, notes)
            VALUES (?, ?, 'expense', ?, ?, ?, 'paid', ?)
        """, (f"[Recorrente] {bill['description']}", bill["amount"], bill["category_id"], bill["payment_method"], today_str, f"Pagamento da conta referente a {month_year}"))
        tx_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO recurring_payments (bill_id, month_year, paid_date, transaction_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(bill_id, month_year) DO UPDATE SET paid_date = excluded.paid_date, transaction_id = excluded.transaction_id;
    """, (bill_id, month_year, today_str, tx_id))
    
    conn.commit()
    conn.close()
    return True

def unpay_recurring_bill(bill_id: int, month_year: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Buscar se havia transação vinculada
    cursor.execute("SELECT transaction_id FROM recurring_payments WHERE bill_id = ? AND month_year = ?", (bill_id, month_year))
    payment = cursor.fetchone()
    if payment and payment["transaction_id"]:
        cursor.execute("DELETE FROM transactions WHERE id = ?", (payment["transaction_id"],))
    
    cursor.execute("DELETE FROM recurring_payments WHERE bill_id = ? AND month_year = ?", (bill_id, month_year))
    conn.commit()
    conn.close()
    return True

def reset_to_demo_data():
    """Limpa e recarrega os dados de demonstração."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recurring_payments;")
    cursor.execute("DELETE FROM recurring_bills;")
    cursor.execute("DELETE FROM goals;")
    cursor.execute("DELETE FROM budgets;")
    cursor.execute("DELETE FROM transactions;")
    cursor.execute("DELETE FROM categories;")
    conn.commit()
    
    for cat in DEFAULT_CATEGORIES:
        cursor.execute(
            "INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)",
            (cat["name"], cat["type"], cat["color"], cat["icon"])
        )
    conn.commit()
    seed_sample_data(conn)
    conn.close()

# -------------------------------------------------------------
# MÉTODOS SAAS: USUÁRIOS, CONTAS BANCÁRIAS E CARTÕES
# -------------------------------------------------------------

def create_user(name: str, email: str, password_hash: str) -> Optional[int]:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email.strip().lower(), password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        # Criar conta padrão 'Carteira' para o novo usuário
        cursor.execute(
            "INSERT INTO accounts (user_id, name, account_type, color) VALUES (?, 'Carteira Principal', 'checking', '#10b981')",
            (user_id,)
        )
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, plan, plan_expires_at, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_user_plan(user_id: int, plan: str, expires_at: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?", (plan, expires_at, user_id))
    conn.commit()
    conn.close()

def get_accounts(user_id: int = 1) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY name ASC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def create_account(user_id: int, name: str, account_type: str = "checking", initial_balance: float = 0.0, color: str = "#10b981") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO accounts (user_id, name, account_type, initial_balance, current_balance, color)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, name, account_type, initial_balance, initial_balance, color))
    conn.commit()
    acc_id = cursor.lastrowid
    conn.close()
    return acc_id

def get_credit_cards(user_id: int = 1) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM credit_cards WHERE user_id = ? AND is_active = 1 ORDER BY name ASC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def create_credit_card(user_id: int, name: str, credit_limit: float, closing_day: int = 25, due_day: int = 5, color: str = "#6366f1") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO credit_cards (user_id, name, credit_limit, closing_day, due_day, color)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, name, credit_limit, closing_day, due_day, color))
    conn.commit()
    card_id = cursor.lastrowid
    conn.close()
    return card_id

    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM categories;")
    categories = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM transactions;")
    transactions = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM budgets;")
    budgets = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM goals;")
    goals = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM recurring_bills;")
    recurring_bills = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "version": "1.0",
        "exported_at": datetime.now().isoformat(),
        "categories": categories,
        "transactions": transactions,
        "budgets": budgets,
        "goals": goals,
        "recurring_bills": recurring_bills
    }
