# Graph Report - financas-casa  (2026-11-22)

## Corpus Check
- 40 files · ~25,325 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 240 nodes · 407 edges · 21 communities (18 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aa5c076a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `authenticateRequest()` - 47 edges
2. `get_connection()` - 31 edges
3. `showToast()` - 19 edges
4. `refreshCurrentView()` - 17 edges
5. `FinanceRequestHandler` - 13 edges
6. `ThreadedHTTPServer` - 8 edges
7. `FinanceWindow` - 7 edges
8. `loadDashboard()` - 7 edges
9. `openModal()` - 7 edges
10. `FinanceApp` - 6 edges

## Surprising Connections (you probably didn't know these)
- `FinanceApp` --uses--> `ThreadedHTTPServer`  [INFERRED]
  gui.py → app.py
- `FinanceWindow` --uses--> `ThreadedHTTPServer`  [INFERRED]
  gui.py → app.py
- `FinanceApp` --uses--> `FinanceRequestHandler`  [INFERRED]
  gui.py → app.py
- `FinanceWindow` --uses--> `FinanceRequestHandler`  [INFERRED]
  gui.py → app.py
- `start_backend_server()` --calls--> `ThreadedHTTPServer`  [EXTRACTED]
  gui.py → app.py

## Import Cycles
- None detected.

## Communities (21 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (36): Connection, add_category(), add_goal(), add_recurring_bill(), add_transaction(), create_account(), create_credit_card(), create_user() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (11): FinanceRequestHandler, run_server(), ThreadedHTTPServer, FinanceApp, FinanceWindow, find_free_port(), main(), start_backend_server() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (8): authState, debounce(), initEventListeners(), initTheme(), state, SVG_ICONS, toggleTheme(), updateThemeButton()

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (16): changeMonth(), closeModal(), deleteBudget(), deleteGoal(), deleteRecurringBill(), deleteTransaction(), handleBudgetSubmit(), handleGoalSubmit() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (10): generate_token(), hash_password(), Any, Módulo de Autenticação e Gestão de Usuários (SaaS). Implementa Hash seguro (PBKD, Gera hash PBKDF2 com salt aleatório de 16 bytes., Valida a senha contra o hash armazenado., Gera token JWT-like assinado (Header.Payload.Signature)., Valida o token e retorna o payload caso seja válido. (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (8): 🚀 Como Fazer o Deploy, 🔒 Dados e Segurança, 📁 Estrutura do Projeto, 💰 Finanças Pessoais ADMX — Plataforma SaaS Serverless, Opção 1: Via Script Automatizado (Terminal), Opção 2: Via GitHub Actions (CI/CD Automático), 🏗️ Stack Tecnológica, 🌟 Visão Geral

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (6): create_pix_charge(), handle_bunkerpay_webhook(), Any, Integração com o Gateway BunkerPay (bunkerpay.io). Gera cobranças PIX com liquid, Gera uma cobrança PIX via BunkerPay para ativação do plano SaaS.     Retorna o Q, Processa webhook recebido do BunkerPay notificando que o PIX foi pago.

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): parse_ofx_content(), parse_ofx_date(), Any, Parser Nativo de Extratos Bancários OFX (Open Financial Exchange). Lê extratos p, Converte datas OFX (ex: 20261115120000[-03:EST] ou 20261115) para YYYY-MM-DD., Analisa o conteúdo de um arquivo .OFX (SGML ou XML) e extrai metadados da conta

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (35): onRequestGet(), onRequestPost(), onRequestGet(), onRequestPost(), onRequestGet(), onRequestPost(), onRequestGet(), onRequestPost() (+27 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (9): adminTogglePlan(), adminToggleSetting(), formatCurrency(), loadAdminDashboard(), loadDashboard(), loadDashboardRecentTx(), renderCategoryDonut(), renderDashboardBudgetsMini() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (8): editGoal(), editTransaction(), escapeHtml(), openGoalModal(), openModal(), openTransactionModal(), populateCategorySelect(), startBunkerpayCheckout()

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (5): checkAuthSession(), handleAuthClick(), handleGateAuthSubmit(), logoutUser(), updateUserUI()

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.50
Nodes (4): loadCategories(), loadInitialData(), loadRecurringBills(), updateRecurringBadge()

## Knowledge Gaps
- **24 isolated node(s):** `Any`, `deploy-cloudflare.sh script`, `KEYWORD_RULES`, `iniciar.sh script`, `Any` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `FinanceRequestHandler` (e.g. with `FinanceApp` and `FinanceWindow`) actually correct?**
  _`FinanceRequestHandler` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Any`, `Módulo de Autenticação e Gestão de Usuários (SaaS). Implementa Hash seguro (PBKD`, `Gera hash PBKDF2 com salt aleatório de 16 bytes.` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1066066066066066 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11578947368421053 - nodes in this community are weakly interconnected._
- **Should `Community 8` be split into smaller, more focused modules?**
  _Cohesion score 0.07077922077922078 - nodes in this community are weakly interconnected._