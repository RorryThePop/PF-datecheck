#!/usr/bin/env python3
"""
Proxy server para contornar restrições CORS da API da PF
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
from urllib.error import HTTPError, URLError
import ssl

class CORSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Verificar se é uma requisição para o proxy da API
        if self.path.startswith('/api/'):
            self.handle_api_proxy()
        else:
            # Servir arquivos estáticos normalmente
            super().do_GET()
    
    def handle_api_proxy(self):
        try:
            # Extrair a URL da API do path
            api_path = self.path[5:]  # Remove '/api/'
            
            # Construir URL completa da API PF
            target_url = f"https://servicos.dpf.gov.br/agenda-publico-rest/api/{api_path}"
            
            print(f"🔄 Fazendo proxy para: {target_url}")
            
            # Configurar headers para simular um navegador
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            # Criar contexto SSL que ignora certificados (se necessário)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Fazer a requisição
            req = urllib.request.Request(target_url, headers=headers)
            
            with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
                data = response.read()
                content_type = response.getheader('Content-Type', 'application/json')
                
                # Configurar headers CORS
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                # Enviar dados
                self.wfile.write(data)
                
                print(f"✅ Resposta enviada com sucesso: {len(data)} bytes")
                
        except HTTPError as e:
            print(f"❌ Erro HTTP: {e.code} - {e.reason}")
            self.send_error_response(f"Erro HTTP: {e.code} - {e.reason}")
            
        except URLError as e:
            print(f"❌ Erro de URL: {e.reason}")
            self.send_error_response(f"Erro de conexão: {e.reason}")
            
        except Exception as e:
            print(f"❌ Erro inesperado: {str(e)}")
            self.send_error_response(f"Erro inesperado: {str(e)}")
    
    def send_error_response(self, message):
        self.send_response(500)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        error_data = {
            'error': True,
            'message': message
        }
        
        self.wfile.write(json.dumps(error_data).encode('utf-8'))
    
    def do_OPTIONS(self):
        # Responder a requisições preflight CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server(port=8000):
    """Iniciar o servidor proxy"""
    handler = CORSProxyHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 Servidor proxy iniciado em http://localhost:{port}")
        print(f"📡 Proxy da API disponível em http://localhost:{port}/api/")
        print(f"🌐 Arquivos estáticos servidos de http://localhost:{port}/")
        print("=" * 50)
        print("Para parar o servidor, pressione Ctrl+C")
        print("=" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor parado pelo usuário")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
