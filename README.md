# 💰 Finanças de Casa - Aplicativo Desktop Nativo para Linux

Aplicativo desktop independente para **Linux** em **Python (GTK3 + WebKitGTK)** para controle financeiro doméstico, organização de receitas e despesas, metas de economia, tetos de gastos e contas fixas recorrentes.

---

## 🖥️ Janela Própria de Desktop (Sem abas de navegador)
O aplicativo abre em sua **própria janela nativa Linux**:
- Janela independente com ícone personalizado, controles de maximizar/minimizar/fechar.
- Não depende de abas ou barras de endereço do navegador.
- Encerramento automático dos processos em segundo plano ao fechar a janela.

---

## ✨ Funcionalidades

1. 📊 **Dashboard Financeiro Consolidado**:
   - Saldo líquido, receitas, despesas e taxa de poupança do mês.
   - **Gráfico Donut** interativo de despesas por categoria.
   - **Gráfico de Barras** comparativo dos últimos 6 meses.

2. 💳 **Extrato de Transações**:
   - Cadastro ágil com categorias, tags, notas e formas de pagamento (PIX, Cartões, Boleto, Dinheiro).
   - Filtros instantâneos e busca textual em tempo real.

3. 🎯 **Orçamentos & Metas de Economia**:
   - Tetos de gastos mensais por categoria com avisos visuais.
   - Metas de economia (Reserva de Emergência, Viagens, Projetos) com barras de progresso.

4. 📅 **Contas Fixas & Recorrentes**:
   - Acompanhamento de vencimentos do mês com alertas de dias restantes.
   - Botão de **1 clique para pagar**, gerando a transação automaticamente.

5. ⚙️ **Relatórios, Importação & Backup**:
   - Exportação para **CSV** e **JSON**.
   - Importação de extratos bancários em CSV.
   - Otimizado para **Impressão e PDF**.
   - Tema Claro e Escuro.
   - 🔍 **Controle de Zoom Persistente**:
     - Botões visuais no topo (`−`, `100%`, `+`).
     - Atalhos de teclado: `Ctrl +` (Aumentar), `Ctrl -` (Diminuir), `Ctrl 0` (Restaurar 100%).
     - Zoom com mouse: `Ctrl + Roda do Mouse`.
     - Nível de zoom salvo automaticamente para as próximas sessões.

---

## 🚀 Como Iniciar

### 1. Pelo Menu de Aplicativos do Linux
Procure por **"Finanças de Casa"** no lançador de aplicativos do seu sistema.

### 2. Pelo Terminal
```bash
cd ~/financas-casa
./iniciar.sh
```
Ou diretamente:
```bash
python3 gui.py
```

---

## 🔒 Dados e Privacidade
- Todos os dados ficam armazenados localmente no banco SQLite `financas.db`.
- **Zero dependências externas de terceiros**: utiliza os módulos nativos do sistema.
