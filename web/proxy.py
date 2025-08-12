#!/usr/bin/env python3
"""
Simple HTTP proxy server to route API calls and serve static files
This fixes CORS issues by serving both frontend and API from the same origin
"""
import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import os

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/leaderboard':
            # Route leaderboard calls to leaderboard service
            self.proxy_leaderboard()
        elif self.path.startswith('/api/'):
            # Route API calls to backend server
            self.proxy_request('GET')
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_request('POST')
        else:
            super().do_POST()
    
    def proxy_request(self, method):
        try:
            # Remove /api prefix and forward to backend
            api_path = self.path[4:]  # Remove '/api'
            backend_url = f'http://localhost:8000{api_path}'
            
            # Read request body for POST requests
            content_length = 0
            post_data = None
            if method == 'POST' and 'Content-Length' in self.headers:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
            
            # Make request to backend
            req = urllib.request.Request(backend_url, data=post_data, method=method)
            
            # Copy headers
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'connection']:
                    req.add_header(header, value)
            
            # Send request
            with urllib.request.urlopen(req) as response:
                # Send response headers
                self.send_response(response.getcode())
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                # Send response body
                self.wfile.write(response.read())
                
        except Exception as e:
            print(f"Proxy error for {self.path}: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({'error': 'Service unavailable'}).encode()
            self.wfile.write(error_response)
    
    def proxy_leaderboard(self):
        try:
            # Route to leaderboard service
            leaderboard_url = 'http://localhost:3001/leaderboard'
            
            with urllib.request.urlopen(leaderboard_url) as response:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response.read())
                
        except Exception as e:
            print(f"Leaderboard proxy error: {e}")
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            # Return empty array for leaderboard when service unavailable
            self.wfile.write(b'[]')

if __name__ == "__main__":
    PORT = 5000
    os.chdir('/home/runner/workspace/web')
    
    with socketserver.TCPServer(("0.0.0.0", PORT), ProxyHandler) as httpd:
        print(f"Proxy server running on http://0.0.0.0:{PORT}")
        print("Routing /api/* to http://localhost:8000")
        print("Routing /api/leaderboard to http://localhost:3001/leaderboard")
        httpd.serve_forever()