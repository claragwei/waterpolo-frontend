#!/bin/bash
# Quick start script for Python backend

echo "🏊 UC Davis Water Polo API - Quick Start"
echo "========================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip"
    exit 1
fi

echo "✅ pip found"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate || . venv/Scripts/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials"
    echo "   Edit the DATABASE_URL in .env file"
    read -p "Press Enter when you've updated .env..."
fi

# Create tables and seed data
echo "🗄️  Creating database tables and seeding data..."
python models.py

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully!"
    echo ""
    echo "🚀 Starting API server..."
    echo "   API will be available at: http://localhost:8000"
    echo "   Docs available at: http://localhost:8000/docs"
    echo ""
    python main.py
else
    echo "❌ Database initialization failed. Please check your DATABASE_URL in .env"
    exit 1
fi
