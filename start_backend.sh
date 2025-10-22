#!/bin/bash

# MediMate Backend Startup Script
echo "🏥 Starting MediMate Backend Server..."
echo "=================================="

# Navigate to the project directory
cd /home/mohd/MediMate

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Navigate to backend directory
cd backend

# Start the backend server
echo "🚀 Starting FastAPI server on port 8001..."
echo "📡 Server URL: http://localhost:8001"
echo "📚 API Docs: http://localhost:8001/docs"
echo "🏥 Health Check: http://localhost:8001/health"
echo ""
echo "Press CTRL+C to stop the server"
echo "=================================="

# Start the working backend
python3 main.py