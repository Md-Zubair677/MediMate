#!/bin/bash

echo "🏥 MediMate Status Check"
echo "========================"

# Check Backend
echo -n "Backend (port 8000): "
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check Frontend
echo -n "Frontend (port 3000): "
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Test Chat API
echo -n "Chat API: "
RESPONSE=$(curl -s -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" -d '{"message": "test"}')
if [[ $RESPONSE == *"response"* ]]; then
    echo "✅ Working"
else
    echo "❌ Not working"
fi

echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
