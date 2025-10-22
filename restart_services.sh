#!/bin/bash

echo "🔄 Restarting MediMate services with correct ports..."

# Kill all processes
pkill -f "react-scripts" || true
pkill -f "uvicorn" || true
pkill -f "working_backend" || true
sleep 3

# Clear any cached processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 2

echo "✅ All processes stopped"

# Start backend on port 8000
echo "🚀 Starting backend on port 8000..."
cd /home/mohd/MediMate/MediMate/backend
python3 working_backend.py &
sleep 5

# Test backend
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend running on port 8000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd /home/mohd/MediMate/MediMate/frontend
BROWSER=none npm start &
sleep 10

echo "🎉 Services restarted!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "⚠️  If still getting port 8001 errors:"
echo "   1. Hard refresh browser (Ctrl+Shift+R)"
echo "   2. Clear browser cache"
echo "   3. Close and reopen browser"
