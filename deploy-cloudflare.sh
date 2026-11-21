#!/bin/bash
set -e

echo "🚀 Preparando Deploy no Cloudflare Pages & D1..."
echo "Account ID detectado: 5b100890eb6a88804f343aa756b5915b (Nader.admx@gmail.com)"
echo ""

# 1. Login no Wrangler (se necessário)
echo "Passo 1: Autenticando com Wrangler..."
npx wrangler login

# 2. Criar banco D1 caso não exista
echo ""
echo "Passo 2: Criando banco D1 'financas_d1'..."
npx wrangler d1 create financas_d1 || true

# 3. Executar migrações locais no D1
echo ""
echo "Passo 3: Aplicando schema SQL no D1..."
npx wrangler d1 execute financas_d1 --file=./migrations/0001_initial_schema.sql --remote

# 4. Deploy no Cloudflare Pages
echo ""
echo "Passo 4: Publicando no Cloudflare Pages..."
npx wrangler pages deploy static --project-name=financas-casa

# 5. Vinculação do Domínio Personalizado
echo ""
echo "Passo 5: Vinculando domínio financaspessoais.admx.tech..."
npx wrangler pages domain set financas-casa financaspessoais.admx.tech || true

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://financaspessoais.admx.tech"
