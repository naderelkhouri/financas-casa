import { onRequestPost as __api_bunkerpay_checkout_js_onRequestPost } from "/home/nader/Documents/Projects/financas-casa/functions/api/bunkerpay/checkout.js"
import { onRequestPost as __api_bunkerpay_webhook_js_onRequestPost } from "/home/nader/Documents/Projects/financas-casa/functions/api/bunkerpay/webhook.js"
import { onRequestPost as __api_import_ofx_js_onRequestPost } from "/home/nader/Documents/Projects/financas-casa/functions/api/import/ofx.js"
import { onRequestGet as __api_accounts_js_onRequestGet } from "/home/nader/Documents/Projects/financas-casa/functions/api/accounts.js"
import { onRequestPost as __api_accounts_js_onRequestPost } from "/home/nader/Documents/Projects/financas-casa/functions/api/accounts.js"
import { onRequestGet as __api_categories_js_onRequestGet } from "/home/nader/Documents/Projects/financas-casa/functions/api/categories.js"
import { onRequestPost as __api_categories_js_onRequestPost } from "/home/nader/Documents/Projects/financas-casa/functions/api/categories.js"
import { onRequestGet as __api_credit_cards_js_onRequestGet } from "/home/nader/Documents/Projects/financas-casa/functions/api/credit-cards.js"
import { onRequestPost as __api_credit_cards_js_onRequestPost } from "/home/nader/Documents/Projects/financas-casa/functions/api/credit-cards.js"
import { onRequestGet as __api_dashboard_js_onRequestGet } from "/home/nader/Documents/Projects/financas-casa/functions/api/dashboard.js"
import { onRequestGet as __api_transactions_js_onRequestGet } from "/home/nader/Documents/Projects/financas-casa/functions/api/transactions.js"
import { onRequestPost as __api_transactions_js_onRequestPost } from "/home/nader/Documents/Projects/financas-casa/functions/api/transactions.js"

export const routes = [
    {
      routePath: "/api/bunkerpay/checkout",
      mountPath: "/api/bunkerpay",
      method: "POST",
      middlewares: [],
      modules: [__api_bunkerpay_checkout_js_onRequestPost],
    },
  {
      routePath: "/api/bunkerpay/webhook",
      mountPath: "/api/bunkerpay",
      method: "POST",
      middlewares: [],
      modules: [__api_bunkerpay_webhook_js_onRequestPost],
    },
  {
      routePath: "/api/import/ofx",
      mountPath: "/api/import",
      method: "POST",
      middlewares: [],
      modules: [__api_import_ofx_js_onRequestPost],
    },
  {
      routePath: "/api/accounts",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_accounts_js_onRequestGet],
    },
  {
      routePath: "/api/accounts",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_accounts_js_onRequestPost],
    },
  {
      routePath: "/api/categories",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_categories_js_onRequestGet],
    },
  {
      routePath: "/api/categories",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_categories_js_onRequestPost],
    },
  {
      routePath: "/api/credit-cards",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_credit_cards_js_onRequestGet],
    },
  {
      routePath: "/api/credit-cards",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_credit_cards_js_onRequestPost],
    },
  {
      routePath: "/api/dashboard",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_dashboard_js_onRequestGet],
    },
  {
      routePath: "/api/transactions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_transactions_js_onRequestGet],
    },
  {
      routePath: "/api/transactions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_transactions_js_onRequestPost],
    },
  ]