#!/usr/bin/env python3
"""
CORS Proxy Server for NFL API Requests
Handles CORS issues by proxying requests server-side
"""

import http.server
import urllib.request
import urllib.parse
import json
import sys
import ssl
from urllib.error import URLError, HTTPError

class CORSProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-RapidAPI-Key, X-RapidAPI-Host, X-API-Key')
        self.end_headers()

    def do_GET(self):
        """Proxy GET requests"""
        try:
            # Parse the requested URL from query parameters
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            
            if 'url' not in query_params:
                self.send_error(400, 'Missing url parameter')
                return
                
            target_url = query_params['url'][0]
            
            # Create request with appropriate headers
            headers = {
                'User-Agent': 'IBY-NFL-Analytics/1.0'
            }
            
            # Add API key headers based on the target URL
            if 'the-odds-api.com' in target_url:
                # The Odds API uses query parameter, not header
                pass
            elif 'api-sports.io' in target_url:
                headers['x-rapidapi-key'] = '47647545b8ddeb4b557a8482be930f09'
                headers['x-rapidapi-host'] = 'v1.american-football.api-sports.io'
            elif 'sportsradar.com' in target_url:
                headers['X-RapidAPI-Key'] = 'YOUR_SPORTSRADAR_KEY'
                
            # Create SSL context that doesn't verify certificates (for development)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Make the request
            req = urllib.request.Request(target_url, headers=headers)
            
            with urllib.request.urlopen(req, timeout=10, context=ssl_context) as response:
                # Get response data
                data = response.read()
                content_type = response.headers.get('content-type', 'application/json')
                
                # Send CORS-enabled response
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', content_type)
                self.end_headers()
                
                self.wfile.write(data)
                
                print(f"✅ Proxied request to: {target_url}")
                
        except HTTPError as e:
            print(f"❌ HTTP Error {e.code}: {e.reason} for {target_url}")
            self.send_response(e.code)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
        except URLError as e:
            print(f"❌ URL Error: {e.reason} for {target_url}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
        except Exception as e:
            print(f"❌ Proxy error: {str(e)}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress default logging
        pass

if __name__ == '__main__':
    port = 8001
    server = http.server.HTTPServer(('localhost', port), CORSProxyHandler)
    print(f"🚀 CORS Proxy Server running on http://localhost:{port}")
    print("💡 Usage: http://localhost:8001/?url=https://api.example.com/data")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Proxy server stopped")
        server.shutdown()