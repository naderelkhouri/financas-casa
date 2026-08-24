#!/usr/bin/env python3
"""
Servidor de Aplicação Web para Gerenciamento de Finanças Domésticas.
Construído com a biblioteca padrão do Python (Zero dependências externas).
"""

import sys
import os
import json
import csv
import io
import mimetypes
import signal
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
import database

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class FinanceRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(body)
        except Exception:
            return {}

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # Roteamento da API REST
        if path == "/api/dashboard":
            month = query.get("month", [None])[0]
            summary = database.get_dashboard_summary(month)
            return self._send_json(summary)

        elif path == "/api/transactions":
            month = query.get("month", [None])[0]
            cat_id = query.get("category_id", [None])[0]
            cat_id = int(cat_id) if cat_id else None
            tx_type = query.get("type", [None])[0]
            search = query.get("search", [None])[0]
            transactions = database.get_transactions(month, cat_id, tx_type, search)
            return self._send_json(transactions)

        elif path == "/api/categories":
            return self._send_json(database.get_categories())

        elif path == "/api/budgets":
            return self._send_json(database.get_budgets())

        elif path == "/api/goals":
            return self._send_json(database.get_goals())

        elif path == "/api/recurring":
            month = query.get("month", [None])[0]
            return self._send_json(database.get_recurring_bills(month))

        elif path == "/api/export/json":
            data = database.export_all_data()
            body = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="financas_backup.json"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path == "/api/export/csv":
            month = query.get("month", [None])[0]
            transactions = database.get_transactions(month=month)
            
            output = io.StringIO()
            writer = csv.writer(output, delimiter=";")
            writer.writerow(["ID", "Data", "Descricao", "Valor (R$)", "Tipo", "Categoria", "Forma de Pagamento", "Status", "Notas", "Tags"])
            
            for t in transactions:
                writer.writerow([
                    t["id"],
                    t["date"],
                    t["description"],
                    f"{t['amount']:.2f}".replace(".", ","),
                    "Receita" if t["type"] == "income" else "Despesa",
                    t.get("category_name") or "Sem Categoria",
                    t.get("payment_method") or "",
                    "Pago" if t["status"] == "paid" else "Pendente",
                    t.get("notes") or "",
                    t.get("tags") or ""
                ])
            
            body = output.getvalue().encode("utf-8-sig")
            filename = f"extrato_{month or 'completo'}.csv"
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # Servir Arquivos Estáticos (SPA)
        if path == "/" or path == "":
            self.path = "/index.html"
        
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        data = self._read_json_body()

        if path == "/api/transactions":
            try:
                tx_id = database.add_transaction(
                    description=data.get("description", ""),
                    amount=data.get("amount", 0),
                    tx_type=data.get("type", "expense"),
                    category_id=data.get("category_id"),
                    payment_method=data.get("payment_method", "PIX"),
                    tx_date=data.get("date"),
                    status=data.get("status", "paid"),
                    notes=data.get("notes", ""),
                    tags=data.get("tags", "")
                )
                return self._send_json({"success": True, "id": tx_id}, status=201)
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path == "/api/categories":
            try:
                cat_id = database.add_category(
                    name=data.get("name", ""),
                    cat_type=data.get("type", "expense"),
                    color=data.get("color", "#64748b"),
                    icon=data.get("icon", "📁")
                )
                return self._send_json({"success": True, "id": cat_id}, status=201)
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path == "/api/budgets":
            try:
                database.save_budget(
                    category_id=int(data["category_id"]),
                    monthly_limit=float(data["monthly_limit"])
                )
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path == "/api/goals":
            try:
                goal_id = database.add_goal(
                    title=data.get("title", ""),
                    target_amount=float(data.get("target_amount", 0)),
                    current_amount=float(data.get("current_amount", 0)),
                    deadline=data.get("deadline", ""),
                    color=data.get("color", "#3b82f6"),
                    icon=data.get("icon", "🎯"),
                    notes=data.get("notes", "")
                )
                return self._send_json({"success": True, "id": goal_id}, status=201)
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path == "/api/recurring":
            try:
                bill_id = database.add_recurring_bill(
                    description=data.get("description", ""),
                    amount=float(data.get("amount", 0)),
                    category_id=data.get("category_id"),
                    due_day=int(data.get("due_day", 1)),
                    payment_method=data.get("payment_method", "PIX"),
                    notes=data.get("notes", "")
                )
                return self._send_json({"success": True, "id": bill_id}, status=201)
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path.startswith("/api/recurring/") and path.endswith("/pay"):
            try:
                bill_id = int(path.split("/")[3])
                month = data.get("month")
                create_tx = data.get("create_transaction", True)
                database.pay_recurring_bill(bill_id, month, create_tx)
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path.startswith("/api/recurring/") and path.endswith("/unpay"):
            try:
                bill_id = int(path.split("/")[3])
                month = data.get("month")
                database.unpay_recurring_bill(bill_id, month)
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path == "/api/import/csv":
            try:
                csv_content = data.get("content", "")
                lines = csv_content.strip().splitlines()
                if not lines:
                    return self._send_json({"error": "Arquivo CSV vazio"}, status=400)
                
                # Detectar delimitador (, ou ;)
                first_line = lines[0]
                delimiter = ";" if ";" in first_line else ","
                reader = csv.DictReader(lines, delimiter=delimiter)
                
                imported_count = 0
                for row in reader:
                    desc = row.get("Descricao") or row.get("Descrição") or row.get("description") or row.get("memo") or "Importado"
                    val_str = row.get("Valor") or row.get("Valor (R$)") or row.get("amount") or "0"
                    val_str = str(val_str).replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
                    val = abs(float(val_str))
                    
                    tx_type = "expense"
                    raw_type = str(row.get("Tipo") or row.get("type") or "").lower()
                    if "receita" in raw_type or "income" in raw_type or float(val_str or 0) > 0 and "despesa" not in raw_type:
                        tx_type = "income"
                    
                    tx_date = row.get("Data") or row.get("date") or date.today().strftime("%Y-%m-%d")
                    # Normalizar data se for DD/MM/YYYY
                    if "/" in tx_date:
                        parts = tx_date.split("/")
                        if len(parts) == 3:
                            tx_date = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"

                    database.add_transaction(
                        description=desc,
                        amount=val,
                        tx_type=tx_type,
                        category_id=None,
                        payment_method="Importado",
                        tx_date=tx_date,
                        status="paid",
                        notes="Importado via arquivo CSV"
                    )
                    imported_count += 1

                return self._send_json({"success": True, "count": imported_count})
            except Exception as e:
                return self._send_json({"error": f"Erro na importação: {str(e)}"}, status=400)

        elif path == "/api/reset-demo":
            database.reset_to_demo_data()
            return self._send_json({"success": True, "message": "Dados de demonstração restaurados."})

        self.send_error(404, "Endpoint não encontrado")

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = self._read_json_body()

        if path.startswith("/api/transactions/"):
            try:
                tx_id = int(path.split("/")[-1])
                database.update_transaction(
                    tx_id=tx_id,
                    description=data.get("description", ""),
                    amount=float(data.get("amount", 0)),
                    tx_type=data.get("type", "expense"),
                    category_id=data.get("category_id"),
                    payment_method=data.get("payment_method", "PIX"),
                    tx_date=data.get("date"),
                    status=data.get("status", "paid"),
                    notes=data.get("notes", ""),
                    tags=data.get("tags", "")
                )
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path.startswith("/api/goals/"):
            try:
                goal_id = int(path.split("/")[-1])
                database.update_goal(
                    goal_id=goal_id,
                    title=data.get("title", ""),
                    target_amount=float(data.get("target_amount", 0)),
                    current_amount=float(data.get("current_amount", 0)),
                    deadline=data.get("deadline", ""),
                    color=data.get("color", "#3b82f6"),
                    icon=data.get("icon", "🎯"),
                    notes=data.get("notes", "")
                )
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        self.send_error(404, "Endpoint não encontrado")

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/transactions/"):
            try:
                tx_id = int(path.split("/")[-1])
                database.delete_transaction(tx_id)
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path.startswith("/api/budgets/"):
            try:
                b_id = int(path.split("/")[-1])
                database.delete_budget(b_id)
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path.startswith("/api/goals/"):
            try:
                g_id = int(path.split("/")[-1])
                database.delete_goal(g_id)
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        elif path.startswith("/api/recurring/"):
            try:
                r_id = int(path.split("/")[-1])
                database.delete_recurring_bill(r_id)
                return self._send_json({"success": True})
            except Exception as e:
                return self._send_json({"error": str(e)}, status=400)

        self.send_error(404, "Endpoint não encontrado")

def run_server(port=8080, open_browser=False):
    database.init_db()
    server_address = ("127.0.0.1", port)
    
    try:
        httpd = ThreadedHTTPServer(server_address, FinanceRequestHandler)
    except OSError as e:
        if e.errno == 98: # Address already in use
            port += 1
            server_address = ("127.0.0.1", port)
            httpd = ThreadedHTTPServer(server_address, FinanceRequestHandler)
        else:
            raise e

    url = f"http://127.0.0.1:{port}"
    print(f"==================================================")
    print(f" 💰 Finanças Domésticas - Servidor Ativo")
    print(f" 🌐 Acesse no Navegador: {url}")
    print(f" 📁 Dados salvos em: {database.DB_FILE}")
    print(f" ⌨️  Pressione Ctrl+C para encerrar com segurança")
    print(f"==================================================")

    def signal_handler(sig, frame):
        print("\n🛑 Encerrando servidor de finanças com segurança...")
        httpd.server_close()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    if open_browser:
        webbrowser.open(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == "__main__":
    port = 8080
    should_open = "--open" in sys.argv
    for arg in sys.argv:
        if arg.startswith("--port="):
            port = int(arg.split("=")[1])
    run_server(port=port, open_browser=should_open)
