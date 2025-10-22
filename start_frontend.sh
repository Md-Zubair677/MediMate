#!/bin/bash

# MediMate Frontend Startup Script
echo "🌐 Starting MediMate Frontend..."
echo "=================================="

# Navigate to the frontend directory
cd /home/mohd/MediMate/MediMate/frontend

# Start the Next.js development server
echo "🚀 Starting Next.js development server..."
echo "🌐 Frontend URL: http://localhost:3000"
echo "🔗 Backend API: http://localhost:8001"
echo ""
echo "Press CTRL+C to stop the server"
echo "=================================="

# Start the frontend
npm run dev