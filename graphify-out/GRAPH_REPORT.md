# Graph Report - financas-casa  (2026-11-21)

## Corpus Check
- 19 files · ~16,254 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 175 nodes · 274 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7436dfeb`
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

## God Nodes (most connected - your core abstractions)
1. `get_connection()` - 31 edges
2. `refreshCurrentView()` - 15 edges
3. `showToast()` - 14 edges
4. `FinanceRequestHandler` - 13 edges
5. `ThreadedHTTPServer` - 8 edges
6. `FinanceWindow` - 7 edges
7. `loadDashboard()` - 7 edges
8. `FinanceApp` - 6 edges
9. `openModal()` - 6 edges
10. `seed_sample_data()` - 5 edges

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

## Communities (18 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (36): Connection, add_category(), add_goal(), add_recurring_bill(), add_transaction(), create_account(), create_credit_card(), create_user() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (11): FinanceRequestHandler, run_server(), ThreadedHTTPServer, FinanceApp, FinanceWindow, find_free_port(), main(), start_backend_server() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (29): applyZoom(), debounce(), editGoal(), editTransaction(), formatCurrency(), initEventListeners(), initTheme(), initZoom() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (17): changeMonth(), closeModal(), deleteBudget(), deleteGoal(), deleteRecurringBill(), deleteTransaction(), escapeHtml(), handleBudgetSubmit() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (10): generate_token(), hash_password(), Any, Módulo de Autenticação e Gestão de Usuários (SaaS). Implementa Hash seguro (PBKD, Gera hash PBKDF2 com salt aleatório de 16 bytes., Valida a senha contra o hash armazenado., Gera token JWT-like assinado (Header.Payload.Signature)., Valida o token e retorna o payload caso seja válido. (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (7): 1. Pelo Menu de Aplicativos do Linux, 2. Pelo Terminal, 🚀 Como Iniciar, 🔒 Dados e Privacidade, 💰 Finanças de Casa - Aplicativo Desktop Nativo para Linux, ✨ Funcionalidades, 🖥️ Janela Própria de Desktop (Sem abas de navegador)

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (6): create_pix_charge(), handle_bunkerpay_webhook(), Any, Integração com o Gateway BunkerPay (bunkerpay.io). Gera cobranças PIX com liquid, Gera uma cobrança PIX via BunkerPay para ativação do plano SaaS.     Retorna o Q, Processa webhook recebido do BunkerPay notificando que o PIX foi pago.

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): parse_ofx_content(), parse_ofx_date(), Any, Parser Nativo de Extratos Bancários OFX (Open Financial Exchange). Lê extratos p, Converte datas OFX (ex: 20261115120000[-03:EST] ou 20261115) para YYYY-MM-DD., Analisa o conteúdo de um arquivo .OFX (SGML ou XML) e extrai metadados da conta

## Knowledge Gaps
- **11 isolated node(s):** `Any`, `deploy-cloudflare.sh script`, `iniciar.sh script`, `Any`, `state` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `FinanceRequestHandler` (e.g. with `FinanceApp` and `FinanceWindow`) actually correct?**
  _`FinanceRequestHandler` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ThreadedHTTPServer` (e.g. with `FinanceApp` and `FinanceWindow`) actually correct?**
  _`ThreadedHTTPServer` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Any`, `Módulo de Autenticação e Gestão de Usuários (SaaS). Implementa Hash seguro (PBKD`, `Gera hash PBKDF2 com salt aleatório de 16 bytes.` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1066066066066066 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08677098150782361 - nodes in this community are weakly interconnected._