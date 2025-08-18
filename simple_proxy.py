#!/usr/bin/env python3
"""
Simple CORS proxy server for PF API
"""

import http.server
import socketserver
import urllib.request
import json
import ssl

class SimpleProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_proxy()
        else:
            super().do_GET()
    
    def handle_api_proxy(self):
        try:
            # Extract API path
            api_path = self.path[5:]  # Remove '/api/'
            target_url = f"https://servicos.dpf.gov.br/agenda-publico-rest/api/{api_path}"
            
            print(f"🔄 Proxy request to: {target_url}")
            
            # Headers to mimic browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            }
            
            # SSL context
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Make request
            req = urllib.request.Request(target_url, headers=headers)
            
            with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
                data = response.read()
                
                # Send CORS headers
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                
                # Send data
                self.wfile.write(data)
                print(f"✅ Response sent: {len(data)} bytes")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.send_error_response(f"Error: {str(e)}")
    
    def send_error_response(self, message):
        self.send_response(500)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        error_data = {'error': True, 'message': message}
        self.wfile.write(json.dumps(error_data).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server(port=8080):
    handler = SimpleProxyHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 Proxy server started at http://localhost:{port}")
        print(f"📡 API proxy available at http://localhost:{port}/api/")
        print(f"🌐 Static files served from http://localhost:{port}/")
        print("=" * 50)
        print("Press Ctrl+C to stop")
        print("=" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
