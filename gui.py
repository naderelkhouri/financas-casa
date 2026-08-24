#!/usr/bin/env python3
"""
Janela Desktop Nativa Linux para Finanças Domésticas.
Construído com PyGObject (Gtk.Application + WebKit2).
Garante integração total com o GNOME/KDE/X11/Wayland Dock e ícone oficial do app.
"""

import sys
import os
import threading
import socket
import signal

import gi
gi.require_version('Gtk', '3.0')
try:
    gi.require_version('WebKit2', '4.1')
except (ValueError, AttributeError):
    gi.require_version('WebKit2', '4.0')
from gi.repository import Gtk, WebKit2, GLib, GdkPixbuf, Gio, Gdk

# O prgname DEVE ser definido antes de qualquer janela para casar com o WM_CLASS / StartupWMClass
GLib.set_prgname("financas")
GLib.set_application_name("Finanças de Casa")

import database
from app import ThreadedHTTPServer, FinanceRequestHandler

def find_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

class FinanceWindow(Gtk.ApplicationWindow):
    def __init__(self, app, url):
        super().__init__(application=app, title="Finanças de Casa")
        
        self.set_default_size(1240, 820)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_wmclass("financas", "financas")
        self.set_role("financas")

        # Configurar Ícone da Janela
        icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "icon.png")
        if os.path.exists(icon_path):
            try:
                pixbuf = GdkPixbuf.Pixbuf.new_from_file(icon_path)
                self.set_icon(pixbuf)
                Gtk.Window.set_default_icon_from_file(icon_path)
            except Exception:
                self.set_icon_name("financas")
                Gtk.Window.set_default_icon_name("financas")
        else:
            self.set_icon_name("financas")
            Gtk.Window.set_default_icon_name("financas")

        # Container com rolagem suave
        scrolled = Gtk.ScrolledWindow()
        self.add(scrolled)

        # WebKit WebView
        self.webview = WebKit2.WebView()
        settings = self.webview.get_settings()
        settings.set_enable_javascript(True)
        settings.set_enable_webgl(True)
        settings.set_enable_smooth_scrolling(True)
        settings.set_enable_developer_extras(False)

        try:
            settings.set_enable_page_cache(True)
            settings.set_enable_offline_web_application_cache(True)
        except Exception:
            pass

        # Suporte a atalhos nativos de zoom
        self.add_events(Gdk.EventMask.KEY_PRESS_MASK | Gdk.EventMask.SCROLL_MASK)
        self.connect("key-press-event", self.on_key_press)
        self.connect("scroll-event", self.on_scroll)

        scrolled.add(self.webview)
        self.webview.load_uri(url)
        self.show_all()

    def on_key_press(self, widget, event):
        ctrl = event.state & Gdk.ModifierType.CONTROL_MASK
        if ctrl:
            keyval = event.keyval
            if keyval in (Gdk.KEY_plus, Gdk.KEY_equal, Gdk.KEY_KP_Add):
                current = self.webview.get_zoom_level()
                self.webview.set_zoom_level(min(2.5, current + 0.1))
                return True
            elif keyval in (Gdk.KEY_minus, Gdk.KEY_underscore, Gdk.KEY_KP_Subtract):
                current = self.webview.get_zoom_level()
                self.webview.set_zoom_level(max(0.6, current - 0.1))
                return True
            elif keyval in (Gdk.KEY_0, Gdk.KEY_KP_0):
                self.webview.set_zoom_level(1.0)
                return True
        return False

    def on_scroll(self, widget, event):
        ctrl = event.state & Gdk.ModifierType.CONTROL_MASK
        if ctrl:
            if event.direction == Gdk.ScrollDirection.UP:
                current = self.webview.get_zoom_level()
                self.webview.set_zoom_level(min(2.5, current + 0.1))
                return True
            elif event.direction == Gdk.ScrollDirection.DOWN:
                current = self.webview.get_zoom_level()
                self.webview.set_zoom_level(max(0.6, current - 0.1))
                return True
        return False

class FinanceApp(Gtk.Application):
    def __init__(self, url):
        super().__init__(
            application_id="com.financas.casa",
            flags=Gio.ApplicationFlags.FLAGS_NONE
        )
        self.url = url
        self.window = None

    def do_activate(self):
        if not self.window:
            self.window = FinanceWindow(self, self.url)
        self.window.present()

def start_backend_server(port):
    database.init_db()
    server_address = ("127.0.0.1", port)
    httpd = ThreadedHTTPServer(server_address, FinanceRequestHandler)
    
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd

def main():
    port = find_free_port()
    httpd = start_backend_server(port)
    app_url = f"http://127.0.0.1:{port}"

    print(f"🚀 Iniciando Finanças de Casa...")
    print(f"📁 Desktop ID / WM_CLASS: financas")
    print(f"🌐 Backend local: {app_url}")

    app = FinanceApp(app_url)
    exit_status = app.run(sys.argv)
    
    try:
        httpd.server_close()
    except Exception:
        pass
    
    sys.exit(exit_status)

if __name__ == "__main__":
    main()
