#!/usr/bin/env python3
"""
Simple HTTP server for IBY NFL Analytics Suite
Serves the HTML files properly with correct MIME types
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

class IBYHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with proper MIME types"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def end_headers(self):
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        super().end_headers()
    
    def guess_type(self, path):
        mimetype, encoding = super().guess_type(path)
        
        # Ensure HTML files are served with correct MIME type
        if path.endswith('.html'):
            return 'text/html', encoding
        elif path.endswith('.css'):
            return 'text/css', encoding
        elif path.endswith('.js'):
            return 'application/javascript', encoding
        
        return mimetype, encoding

def find_available_port(start_port=3000):
    """Find an available port starting from start_port"""
    import socket
    
    for port in range(start_port, start_port + 100):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    
    raise RuntimeError("Could not find an available port")

def main():
    """Start the server"""
    try:
        port = find_available_port()
        
        print("🎨 Starting IBY NFL Analytics Suite Server")
        print("=" * 50)
        print(f"🌐 Server starting on port {port}")
        print(f"📂 Serving files from: {os.getcwd()}")
        print(f"🔗 Open in browser: http://localhost:{port}/index-iby.html")
        print("=" * 50)
        print("📝 Available pages:")
        print("   • http://localhost:{}/index-iby.html (New IBY Theme)".format(port))
        print("   • http://localhost:{}/nfl-analytics.html (Original with IBY theme)".format(port))
        print("   • http://localhost:{}/nfl-analytics-redesigned.html (Redesigned version)".format(port))
        print("=" * 50)
        print("🛑 Press Ctrl+C to stop the server")
        print()
        
        # Start server
        with socketserver.TCPServer(("localhost", port), IBYHTTPRequestHandler) as httpd:
            # Try to open browser
            try:
                webbrowser.open(f'http://localhost:{port}/index-iby.html')
                print("🚀 Browser opened automatically")
            except:
                print("⚠️  Could not open browser automatically")
            
            print(f"✅ Server running at http://localhost:{port}")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()