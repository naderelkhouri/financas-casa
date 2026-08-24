#!/usr/bin/env bash
# ==============================================================================
# Script de Inicialização - Finanças de Casa (App Desktop Nativo)
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado!"
    exit 1
fi

# Tentar iniciar a Janela Nativa GTK3 Desktop
if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
    echo "💻 Abrindo Finanças de Casa em Janela Desktop Própria..."
    exec python3 "$DIR/gui.py"
else
    # Fallback se executado sem display gráfico
    echo "🌐 Modo servidor HTTP (Sem display gráfico detectado)..."
    exec python3 "$DIR/app.py" --port=8080
fi
