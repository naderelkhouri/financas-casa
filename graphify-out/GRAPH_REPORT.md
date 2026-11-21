# Graph Report - financas-casa  (2026-11-21)

## Corpus Check
- 27 files · ~20,746 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 217 nodes · 345 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9b1cf91`
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]

## God Nodes (most connected - your core abstractions)
1. `get_connection()` - 31 edges
2. `fetch()` - 21 edges
3. `refreshCurrentView()` - 15 edges
4. `showToast()` - 14 edges
5. `FinanceRequestHandler` - 13 edges
6. `ThreadedHTTPServer` - 8 edges
7. `loadDashboard()` - 8 edges
8. `FinanceWindow` - 7 edges
9. `FinanceApp` - 6 edges
10. `openModal()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `deleteRecurringBill()` --calls--> `fetch()`  [INFERRED]
  static/app.js → .wrangler/tmp/pages-a2Fbgy/functionsWorker-0.20567011253490008.js
- `deleteTransaction()` --calls--> `fetch()`  [INFERRED]
  static/app.js → .wrangler/tmp/pages-a2Fbgy/functionsWorker-0.20567011253490008.js
- `handleBudgetSubmit()` --calls--> `fetch()`  [INFERRED]
  static/app.js → .wrangler/tmp/pages-a2Fbgy/functionsWorker-0.20567011253490008.js
- `handleGoalSubmit()` --calls--> `fetch()`  [INFERRED]
  static/app.js → .wrangler/tmp/pages-a2Fbgy/functionsWorker-0.20567011253490008.js
- `handleRecurringSubmit()` --calls--> `fetch()`  [INFERRED]
  static/app.js → .wrangler/tmp/pages-a2Fbgy/functionsWorker-0.20567011253490008.js

## Import Cycles
- None detected.

## Communities (24 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (36): Connection, add_category(), add_goal(), add_recurring_bill(), add_transaction(), create_account(), create_credit_card(), create_user() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (11): FinanceRequestHandler, run_server(), ThreadedHTTPServer, FinanceApp, FinanceWindow, find_free_port(), main(), start_backend_server() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (18): applyZoom(), debounce(), formatCurrency(), initEventListeners(), initTheme(), initZoom(), loadDashboard(), loadDashboardRecentTx() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (15): changeMonth(), closeModal(), deleteRecurringBill(), deleteTransaction(), escapeHtml(), handleBudgetSubmit(), handleGoalSubmit(), handleRecurringSubmit() (+7 more)

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

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (7): editGoal(), editTransaction(), openGoalModal(), openModal(), openTransactionModal(), populateCategorySelect(), startBunkerpayCheckout()

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (12): arrayToRegexp(), escapeString(), flags(), lexer(), match(), onRequestPost3(), parse(), pathToRegexp() (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (10): fetch(), deleteBudget(), deleteGoal(), loadAccountsAndCards(), loadBudgetsAndGoals(), loadCategories(), loadInitialData(), loadRecurringBills() (+2 more)

## Knowledge Gaps
- **23 isolated node(s):** `routes`, `Any`, `deploy-cloudflare.sh script`, `iniciar.sh script`, `Any` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetch()` connect `Community 21` to `Community 19`, `Community 2`, `Community 3`, `Community 20`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `fetch()` (e.g. with `deleteBudget()` and `deleteGoal()`) actually correct?**
  _`fetch()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `FinanceRequestHandler` (e.g. with `FinanceApp` and `FinanceWindow`) actually correct?**
  _`FinanceRequestHandler` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `routes`, `Any`, `Módulo de Autenticação e Gestão de Usuários (SaaS). Implementa Hash seguro (PBKD` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1066066066066066 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._