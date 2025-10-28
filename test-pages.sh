#!/bin/bash

echo "🧪 Testing NFL/NCAA Analytics Pages..."
echo ""

BASE_URL="http://localhost:8080"

PAGES=(
    "index.html"
    "nfl-live-games.html"
    "nfl-analytics.html"
    "nfl-betting.html"
    "nfl-predictions.html"
    "nfl-upcoming-games.html"
    "ncaa-live-games.html"
    "ncaa-analytics.html"
    "player-props-hub.html"
)

FAILED=0
PASSED=0

for page in "${PAGES[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$page")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ $page - OK"
        ((PASSED++))
    else
        echo "❌ $page - FAILED (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
done

echo ""
echo "📊 Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
    echo "🎉 All pages working!"
    exit 0
else
    echo "⚠️  Some pages need attention"
    exit 1
fi
