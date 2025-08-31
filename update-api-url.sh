#!/bin/bash

echo "🔗 Update API URL Script"
echo "========================"

echo "After Railway deployment, you'll get a URL like:"
echo "https://sunday-edge-pro-api-production-1234.up.railway.app"
echo ""
echo "Enter your Railway URL below (without trailing slash):"
read -p "Railway URL: " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

echo "🔧 Updating API client with URL: $RAILWAY_URL"

# Update the API client file
sed -i.backup "s|https://sunday-edge-pro-api-production-xxxx.up.railway.app|$RAILWAY_URL|g" public/js/api-client.js

echo "✅ API URL updated!"
echo "📁 Original file backed up as: public/js/api-client.js.backup"
echo ""
echo "🚀 Next steps:"
echo "1. Upload the updated 'public' folder to your current web hosting"
echo "2. Test your site at your domain"
echo "3. Check browser console for '✅ Secure API service online'"