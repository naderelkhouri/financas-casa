# 💰 Finanças Pessoais ADMX — Plataforma SaaS Serverless

> **Domínio de Produção:** `https://financaspessoais.admx.tech`  
> **Status:** Pronto para Produção & Deploy Automático (CI/CD)  
> **Arquitetura:** Cloudflare Pages + Edge Functions + Cloudflare D1 + PWA + BunkerPay  
> **Repositório:** [https://github.com/naderelkhouri/financas-casa](https://github.com/naderelkhouri/financas-casa)  

---

## 🌟 Visão Geral

O **Finanças Pessoais ADMX** é um SaaS moderno de gestão financeira individual e doméstica focado em:
1. **Privacidade Patrimonial e Autonomia:** Controle total sobre os próprios dados financeiros e integração com **BunkerPay** (pagamento em PIX com liquidação direta/cripto).
2. **Importação Inteligente de Extratos Bancários (.OFX):** Compatível com extratos dos principais bancos brasileiros (Nubank, Itaú, Inter, Bradesco, Santander, etc.).
3. **Multi-Contas & Cartões de Crédito:** Controle de limites, faturas futuras, dias de fechamento e vencimento.
4. **Orçamentos & Metas de Poupança:** Tetos de gastos por categoria e barras de progresso para metas financeiras (Reserva de Emergência, Viagens, etc.).
5. **Mobile-First (PWA):** Aplicativo instalável no smartphone (Android/iOS) direto pelo navegador, sem necessidade de app stores.

---

## 🏗️ Stack Tecnológica

- **Frontend:** SPA nativo em HTML5, CSS3 moderno com suporte a temas Claro/Escuro, SVG Chart Engine responsivo e PWA Service Worker.
- **Backend / Edge Functions:** Cloudflare Pages Functions em JavaScript ES Modules rodando na malha global da Cloudflare.
- **Banco de Dados Relacional:** Cloudflare D1 (SQL Serverless baseado em SQLite de alta performance).
- **Billing & Assinaturas:** BunkerPay Gateway (PIX Copia e Cola + Webhooks para liberação automática do plano Pro).
- **CI/CD:** GitHub Actions com deploy contínuo em cada `git push origin main`.

---

## 📁 Estrutura do Projeto

```text
financas-casa/
├── .github/workflows/deploy.yml   # Pipeline CI/CD GitHub Actions
├── functions/api/                 # Edge Functions Serverless (Cloudflare)
│   ├── dashboard.js               # Métricas e distribuição por categoria
│   ├── transactions.js            # Lançamentos e extrato financeiro
│   ├── categories.js              # Categorias de receitas e despesas
│   ├── accounts.js                # Contas bancárias e carteiras
│   ├── credit-cards.js            # Cartões de crédito e limites
│   ├── import/ofx.js              # Parser de extratos bancários .OFX
│   └── bunkerpay/
│       ├── checkout.js            # Geração de cobranças PIX
│       └── webhook.js             # Recepção de pagamentos e upgrade de plano
├── migrations/
│   └── 0001_initial_schema.sql    # Schema completo e seed para o Cloudflare D1
├── static/                        # Frontend SPA & PWA
│   ├── index.html                 # Interface principal e modais
│   ├── styles.css                 # Design system responsivo e temas
│   ├── app.js                     # Motor SPA, gráficos SVG e chamadas de API
│   ├── manifest.json              # Configuração do PWA para celular
│   ├── sw.js                      # Service Worker para cache e modo offline
│   ├── _headers                   # Regras de cache imutável no Edge CDN
│   └── _redirects                 # Fallback SPA (/* /index.html 200)
├── deploy-cloudflare.sh           # Script de automação e deploy local
└── wrangler.toml                  # Configurações do projeto e bindings D1
```

---

## 🚀 Como Fazer o Deploy

### Opção 1: Via Script Automatizado (Terminal)
```bash
cd /home/nader/Documents/Projects/financas-casa
./deploy-cloudflare.sh
```

### Opção 2: Via GitHub Actions (CI/CD Automático)
Basta adicionar a secret `CLOUDFLARE_API_TOKEN` no seu repositório do GitHub em **Settings** > **Secrets and variables** > **Actions**. Todo push para a branch `main` realizará o deploy automaticamente.

---

## 🔒 Dados e Segurança
- Sem trackers invasivos ou vazamento de dados bancários.
- Roteamento 100% criptografado com HTTPS/TLS na borda da Cloudflare.
- Headers estritos de segurança (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`).
